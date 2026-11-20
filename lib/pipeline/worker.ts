/// <reference lib="webworker" />
/**
 * 管线跑在 Worker 里：76 格约 1.2–1.5 秒，放主线程会把 UI 卡死。
 * 主线程只负责解码图片（createImageBitmap 走原生解码，比纯 JS 快）和画界面。
 */
import { buildLayout, CHARS } from '../template';
import { rectify, segmentCell, cellToPath, measureInk, maskToPath, XH, buildFont, RectifyError, type ManualCorners, type CellResult } from './pipeline';
import { segmentFreeform, freeformCharToPath, FreeformError, type FreeformResult } from './freeform';
import { toGray } from './imgops';

export type WorkerRequest =
  | { type: 'process'; rgba: Uint8ClampedArray; width: number; height: number; manual?: ManualCorners }
  | { type: 'build'; fontName: string; overrides: Record<string, { mask: Uint8ClampedArray; w: number; h: number; y0c: number }> }
  | { type: 'processFreeform'; rgba: Uint8ClampedArray; width: number; height: number; rows: string[] }
  | { type: 'buildFreeform'; fontName: string }
  | {
      /** 浏览器直写：前端已经拿到干净的掩膜，几何是我们自己定的，无需切割 */
      type: 'buildMasks'; fontName: string;
      items: { char: string; mask: Uint8ClampedArray; w: number; h: number }[];
      baselineY: number; xheightY: number;
    };

export interface CellSummary {
  char: string;
  w: number; h: number; y0c: number;
  coverage: number;
  confidence: number;
  status: CellResult['status'];
}

export interface FreeformRowSummary {
  index: number; top: number; bottom: number; baseline: number;
  found: number; expected: number; chars: string[];
}

export type WorkerResponse =
  | { type: 'progress'; phase: string; done: number; total: number }
  | {
      type: 'freeformProcessed';
      rows: FreeformRowSummary[];
      /** baseTop = 基线在该字符掩膜坐标里的 y —— 缩略图靠它对齐基线 */
      masks: Record<string, { mask: Uint8ClampedArray; w: number; h: number; baseTop: number }>;
      scaleBasis: number; ms: number;
    }
  | { type: 'processed'; cells: CellSummary[]; masks: Record<string, Uint8ClampedArray>; ms: number }
  | { type: 'built'; ttf: ArrayBuffer; woff: ArrayBuffer | null; included: string[]; ms: number }
  | { type: 'needsManualCorners'; message: string }
  | { type: 'error'; message: string };

const post = (m: WorkerResponse, transfer?: Transferable[]) =>
  (self as any).postMessage(m, transfer ?? []);

const layout = buildLayout();
/** 处理结果缓存在 Worker 里，装配时不必把掩膜再传回来 */
let cache: Record<string, CellResult> = {};
let freeformCache: FreeformResult | null = null;

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;
  try {
    if (msg.type === 'process') return handleProcess(msg);
    if (msg.type === 'build') return handleBuild(msg);
    if (msg.type === 'processFreeform') return handleFreeform(msg);
    if (msg.type === 'buildFreeform') return handleBuildFreeform(msg);
    if (msg.type === 'buildMasks') return handleBuildMasks(msg);
  } catch (err: any) {
    if (err instanceof FreeformError) post({ type: 'error', message: err.message });
    else if (err instanceof RectifyError) post({ type: 'needsManualCorners', message: err.message });
    else post({ type: 'error', message: err?.message ?? String(err) });
  }
};

function handleProcess(msg: Extract<WorkerRequest, { type: 'process' }>) {
  const t0 = performance.now();
  post({ type: 'progress', phase: 'Correcting perspective', done: 0, total: CHARS.length });
  const gray = toGray(msg.rgba, msg.width, msg.height);
  const rect = rectify(gray, msg.width, msg.height, msg.manual);

  cache = {};
  const cells: CellSummary[] = [];
  const masks: Record<string, Uint8ClampedArray> = {};
  CHARS.forEach((ch, i) => {
    const r = segmentCell(rect, layout.cells[ch]);
    cache[ch] = r;
    masks[ch] = r.mask;
    cells.push({ char: ch, w: r.w, h: r.h, y0c: r.y0c, coverage: r.coverage, confidence: r.confidence, status: r.status });
    if (i % 8 === 0) post({ type: 'progress', phase: 'Cutting out characters', done: i, total: CHARS.length });
  });
  post({ type: 'processed', cells, masks, ms: Math.round(performance.now() - t0) });
}

function handleBuild(msg: Extract<WorkerRequest, { type: 'build' }>) {
  const t0 = performance.now();
  const glyphs: { char: string; path: any; advance: number }[] = [];
  const included: string[] = [];

  /**
   * 先把这套笔迹的真实度量量出来，再生成字形。
   * 必须先量后生成 —— 度量是全局的，逐字形现算会退化成 bbox 归一化，
   * 那正是文件里三令五申禁止的做法。
   */
  const segMap = new Map<string, CellResult>();
  CHARS.forEach((ch) => {
    const ov = msg.overrides[ch];
    const seg = ov
      ? { char: ch, mask: ov.mask, w: ov.w, h: ov.h, y0c: ov.y0c, coverage: 0.1, confidence: 1, status: 'ok' as const }
      : cache[ch];
    if (seg) segMap.set(ch, seg);
  });
  const ink = measureInk(segMap, layout);

  CHARS.forEach((ch, i) => {
    const seg: CellResult | undefined = segMap.get(ch);
    if (!seg || seg.status !== 'ok') return;
    const r = cellToPath(seg, layout.cells[ch], ink);
    if (!r) return;
    glyphs.push({ char: ch, path: r.path, advance: r.advance });
    included.push(ch);
    if (i % 8 === 0) post({ type: 'progress', phase: 'Building glyphs', done: i, total: CHARS.length });
  });

  if (!glyphs.length) return post({ type: 'error', message: 'No usable glyphs — every box failed the quality check. Check the lighting and that the ink is dark enough, then retake the photo.' });
  post({ type: 'progress', phase: 'Assembling the font', done: CHARS.length, total: CHARS.length });
  const font = buildFont(glyphs, msg.fontName);
  const ttf = font.toArrayBuffer();
  post({ type: 'built', ttf, woff: null, included, ms: Math.round(performance.now() - t0) }, [ttf]);
}


/** 白纸流程：整页切行 -> 分组 -> 按已知顺序分配 -> 反推基线 */
function handleFreeform(msg: Extract<WorkerRequest, { type: 'processFreeform' }>) {
  const t0 = performance.now();
  post({ type: 'progress', phase: 'Finding lines of writing', done: 0, total: 1 });
  const gray = toGray(msg.rgba, msg.width, msg.height);
  const r = segmentFreeform(gray, msg.width, msg.height, { rows: msg.rows });
  freeformCache = r;

  const masks: Record<string, { mask: Uint8ClampedArray; w: number; h: number; baseTop: number }> = {};
  for (const c of r.chars) masks[c.char] = { mask: c.mask, w: c.w, h: c.h, baseTop: c.baseline - c.y0 };
  post({
    type: 'freeformProcessed',
    rows: r.rows.map((row) => ({
      index: row.index, top: row.top, bottom: row.bottom, baseline: row.baseline,
      found: row.found, expected: row.expected, chars: row.chars.map((c) => c.char),
    })),
    masks, scaleBasis: r.scaleBasis, ms: Math.round(performance.now() - t0),
  });
}

function handleBuildFreeform(msg: Extract<WorkerRequest, { type: 'buildFreeform' }>) {
  const t0 = performance.now();
  if (!freeformCache) return post({ type: 'error', message: 'No photo has been processed yet.' });
  const glyphs: { char: string; path: any; advance: number }[] = [];
  const included: string[] = [];
  freeformCache.chars.forEach((c, i) => {
    const p = freeformCharToPath(c, freeformCache!.scaleBasis);
    if (!p) return;
    glyphs.push({ char: c.char, path: p.path, advance: p.advance });
    included.push(c.char);
    if (i % 8 === 0) post({ type: 'progress', phase: 'Building glyphs', done: i, total: freeformCache!.chars.length });
  });
  if (!glyphs.length) return post({ type: 'error', message: 'No usable glyphs were produced from this photo.' });
  const ttf = buildFont(glyphs, msg.fontName).toArrayBuffer();
  post({ type: 'built', ttf, woff: null, included, ms: Math.round(performance.now() - t0) }, [ttf]);
}


/**
 * 浏览器直写：画布几何由我们定义，基线与 x-height 是精确已知的常数，
 * 所以度量比照片路径更准 —— 没有透视、没有拟合、没有二值化误差。
 */
function handleBuildMasks(msg: Extract<WorkerRequest, { type: 'buildMasks' }>) {
  const t0 = performance.now();
  const s = XH / (msg.baselineY - msg.xheightY);
  const glyphs: { char: string; path: any; advance: number }[] = [];
  const included: string[] = [];
  msg.items.forEach((it, i) => {
    const p = maskToPath(it.mask, it.w, it.h, msg.baselineY, s);
    if (!p) return;
    glyphs.push({ char: it.char, path: p.path, advance: p.advance });
    included.push(it.char);
    if (i % 8 === 0) post({ type: 'progress', phase: 'Building glyphs', done: i, total: msg.items.length });
  });
  if (!glyphs.length) return post({ type: 'error', message: 'No characters have been drawn yet.' });
  const ttf = buildFont(glyphs, msg.fontName).toArrayBuffer();
  post({ type: 'built', ttf, woff: null, included, ms: Math.round(performance.now() - t0) }, [ttf]);
}
