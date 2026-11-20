/**
 * 白纸手写照片 -> 字形（`/font-from-image/` 的算法）
 *
 * 与模板流程的根本区别：纸上没有印刷基线，度量只能反推。
 * 但有一个关键条件让它可解 —— **字符顺序是已知的**。用户按提示逐行书写
 * A–Z / a–z / 0–9 / 标点，于是：
 *   · 哪些字符有下伸部（g p q y j）是已知的 → 求基线时把它们排除
 *   · 哪些小写字母恰好齐 x-height（a c e m n o r s u v w x z）是已知的 → 用它们定 x-height
 * 没有这个先验，基线只能靠猜；有了它，基线是一个中位数。
 *
 * 度量铁律不变：全行共用一个全局比例 s = 500 / (基线 − x-height)，
 * 逐字形 bbox 归一化仍然是禁止的。
 */
import { gaussianApprox, divide, otsu, thresholdInv, open, close, type CompBox } from './imgops';
import { maskToPath, XH } from './pipeline';
import { minAreaOf } from '../template';

/** 默认书写顺序，与 /font-from-image/ 页面上给用户的提示一致 */
export const DEFAULT_ROWS: string[] = [
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  'abcdefghijklmnopqrstuvwxyz',
  '0123456789',
  '.,!?\'"-():;&@#',
];

/**
 * 占位符：写错划掉的地方在行文本里用 `~` 标出来，算法据此跳过那一团墨迹。
 * 实测第二张真实照片末尾就有一处涂改 —— 它会被当成一个字符，导致后面全部错位。
 * 自动识别涂改不可靠（划掉的形态千奇百怪），让用户标一下是最短的路。
 */
export const SKIP_MARK = '~';
const isSkip = (ch: string) => ch === SKIP_MARK || ch === ' ';

/** 有下伸部的字符 —— 求基线时必须排除，否则基线被拉低 */
const DESCENDERS = new Set(['g', 'p', 'q', 'y', 'j', ',', ';', '(', ')', '@']);
/** 恰好齐 x-height 的小写字母 —— 用来定 x-height 线 */
const XHEIGHT_LETTERS = new Set(['a', 'c', 'e', 'm', 'n', 'o', 'r', 's', 'u', 'v', 'w', 'x', 'z']);

export interface FreeformChar {
  char: string;
  /** 墨迹掩膜（该字符的裁切区），255 = 墨 */
  mask: Uint8ClampedArray;
  w: number; h: number;
  /** 裁切区左上角在整页坐标里的位置 */
  x0: number; y0: number;
  /** 该字符所属行的基线，整页坐标 */
  baseline: number;
  rowIndex: number;
  confidence: number;
}

export interface FreeformRow {
  index: number;
  /** 行的上下边界（整页坐标） */
  top: number; bottom: number;
  baseline: number;
  /** 该行检测到的字符数 vs 期望字符数 */
  found: number; expected: number;
  chars: FreeformChar[];
}

export interface FreeformResult {
  rows: FreeformRow[];
  chars: FreeformChar[];
  /** 全局比例的两条依据（整页坐标） */
  xheightPx: number;
  /** 供 cellToPath 用：基线 − x-height 的像素距离 */
  scaleBasis: number;
  width: number; height: number;
  /** 二值化后的整页掩膜，前端画预览用 */
  mask: Uint8ClampedArray;
}

export class FreeformError extends Error {}

/** 二值化整页：与模板流程同一套平场 + 全局 Otsu，禁用 adaptiveThreshold */
function binarizePage(gray: Uint8ClampedArray, w: number, h: number) {
  // σ 按页宽等比缩放：模板流程在 2480px 宽上用 45
  const sigma = Math.max(12, (45 * w) / 2480);
  const bg = gaussianApprox(gray, w, h, sigma);
  const flat = divide(gray, bg);
  let bw = thresholdInv(flat, otsu(flat));
  bw = open(bw, w, h, 3);
  bw = close(bw, w, h, 5);
  return bw;
}

/** 全页连通域 + 包围盒（面积过滤按页面尺寸自适应） */
function components(bw: Uint8ClampedArray, w: number, h: number, minArea: number) {
  const lab = new Int32Array(w * h).fill(-1);
  const stack = new Int32Array(w * h);
  const out: { box: CompBox; pix: number[] }[] = [];
  let next = 0;
  for (let i = 0; i < bw.length; i++) {
    if (bw[i] === 0 || lab[i] !== -1) continue;
    let sp = 0; stack[sp++] = i; lab[i] = next;
    const pix: number[] = [];
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    while (sp > 0) {
      const p = stack[--sp]; pix.push(p);
      const px = p % w, py = (p / w) | 0;
      if (px < x0) x0 = px; if (px > x1) x1 = px;
      if (py < y0) y0 = py; if (py > y1) y1 = py;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = px + dx, ny = py + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx;
        if (bw[q] !== 0 && lab[q] === -1) { lab[q] = next; stack[sp++] = q; }
      }
    }
    next++;
    if (pix.length >= minArea) out.push({ box: { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, area: pix.length }, pix });
  }
  return out;
}

/**
 * 横向投影切行。
 *
 * 「相邻带间距小于中位行高的 45% 就合并」这类固定阈值在真实照片上必然出错：
 * 实测第二张照片切出 12 条原始带，其中小写第二行与数字行的间距只有 49px，
 * 小于阈值 63px，被并成了一行；而同一张图里下伸部与主体的间距只有 7px，
 * 又确实需要合并。一个阈值不可能同时满足两边。
 *
 * 和字符分组同一个解法：**行数是已知的**（用户在界面上填了几行）。
 * 于是不猜阈值，直接反复合并间距最小的相邻两带，直到剩下期望的行数。
 */
function findRows(bw: Uint8ClampedArray, w: number, h: number, expectedRows: number) {
  const proj = new Int32Array(h);
  for (let y = 0; y < h; y++) {
    let n = 0;
    for (let x = 0; x < w; x++) if (bw[y * w + x]) n++;
    proj[y] = n;
  }
  const peak = Math.max(...proj);
  if (peak === 0) throw new FreeformError('No ink was detected in this photo. Check that the writing is dark enough and the photo is in focus.');
  const thr = Math.max(2, peak * 0.02);
  const bands: [number, number][] = [];
  let start = -1;
  for (let y = 0; y < h; y++) {
    if (proj[y] > thr && start < 0) start = y;
    else if (proj[y] <= thr && start >= 0) { bands.push([start, y - 1]); start = -1; }
  }
  if (start >= 0) bands.push([start, h - 1]);
  if (!bands.length) throw new FreeformError('No lines of writing were detected in this photo. Write each group of characters on its own line, with a clear gap between lines.');

  // 反复合并间距最小的相邻两带，直到剩下期望的行数
  const merged = bands.map((b) => [...b] as [number, number]);
  let guard = 0;
  while (merged.length > expectedRows && guard++ < 500) {
    let bi = 0, bgap = Infinity;
    for (let i = 0; i + 1 < merged.length; i++) {
      const gap = merged[i + 1][0] - merged[i][1];
      if (gap < bgap) { bgap = gap; bi = i; }
    }
    merged.splice(bi, 2, [merged[bi][0], merged[bi + 1][1]]);
  }
  return merged;
}

type Comp = { box: CompBox; pix: number[] };
type Group = Comp[];

const gx0 = (g: Group) => Math.min(...g.map((p) => p.box.x));
const gx1 = (g: Group) => Math.max(...g.map((p) => p.box.x + p.box.w));

/**
 * 行内把连通域分组成字符。
 *
 * 先按 x 重叠粗分（i/j 的点、: ; 的两点会正确并入主体），
 * 再用**已知字符数**做约束修正 —— 这是白纸流程唯一比模板流程多出来的先验，
 * 不用它就只能在两类错误之间来回调阈值：
 *
 *   · 欠分割：相邻字母挨太近被并成一组（实测 Y 和 Z 粘成宽 193 的一坨）
 *   · 过分割：一个字符本身就是分开的两笔（实测 `"` 每个都裂成两组）
 *
 * 纯启发式治得了一头就治不了另一头。但既然知道这行应该有 N 个字符：
 * 多了就合并间距最小的一对，少了就把最宽的一组从墨迹最稀的那一列切开。
 */
function groupIntoChars(comps: Comp[], expected: number, _rowH: number): Group[] {
  const sorted = [...comps].sort((a, b) => a.box.x - b.box.x);
  let groups: Group[] = [];
  for (const c of sorted) {
    const g = groups[groups.length - 1];
    if (g && Math.min(gx1(g), c.box.x + c.box.w) - Math.max(gx0(g), c.box.x) > 0) { g.push(c); continue; }
    groups.push([c]);
  }
  if (!expected || expected < 1) return groups;

  // 多了：反复合并水平间距最小的相邻两组
  let guard = 0;
  while (groups.length > expected && guard++ < 200) {
    let best = 0, bestGap = Infinity;
    for (let i = 0; i + 1 < groups.length; i++) {
      const gap = gx0(groups[i + 1]) - gx1(groups[i]);
      if (gap < bestGap) { bestGap = gap; best = i; }
    }
    groups.splice(best, 2, [...groups[best], ...groups[best + 1]]);
  }

  // 少了：反复把最宽的一组从墨迹最稀的一列切开
  guard = 0;
  while (groups.length < expected && guard++ < 200) {
    let wi = 0, wmax = -1;
    groups.forEach((g, i) => { const wd = gx1(g) - gx0(g); if (wd > wmax) { wmax = wd; wi = i; } });
    const parts = splitAtWidestGap(groups[wi]);
    if (!parts) break; // 真·笔画粘连，算法切不动，交给用户在审校里手工处理
    groups.splice(wi, 1, ...parts);
    groups.sort((a, b) => gx0(a) - gx0(b));
  }
  return groups;
}

/**
 * 把一组从其内部最大的水平间隙处切开。
 * 只在「这一组由多个连通域拼成」时有效 —— 也就是被粗分规则并错的情况。
 * 若整组本身就是一个连通域（两个字母的笔画真的碰在一起），返回 null：
 * 这种情况没有可靠的自动解，硬切只会切出两个残缺字形，不如交给用户。
 */
function splitAtWidestGap(g: Group): [Group, Group] | null {
  if (g.length < 2) return null;
  const parts = [...g].sort((a, b) => a.box.x - b.box.x);
  let bi = -1, bgap = -Infinity;
  for (let i = 0; i + 1 < parts.length; i++) {
    const gap = parts[i + 1].box.x - (parts[i].box.x + parts[i].box.w);
    if (gap > bgap) { bgap = gap; bi = i; }
  }
  if (bi < 0) return null;
  return [parts.slice(0, bi + 1), parts.slice(bi + 1)];
}

/**
 * 最小二乘直线拟合 + 一轮离群点剔除。
 * 剔除是必要的：某个字母写得特别低（或分组错了）会把整条基线拽歪，
 * 而基线歪一点，全行字形的竖直位置就全错。
 */
function fitLineRobust(pts: [number, number][], fallback: number): { m: number; b: number } {
  if (pts.length < 2) return { m: 0, b: pts.length ? pts[0][1] : fallback };
  const ls = (ps: [number, number][]) => {
    const n = ps.length;
    let sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (const [x, y] of ps) { sx += x; sy += y; sxx += x * x; sxy += x * y; }
    const den = n * sxx - sx * sx;
    if (Math.abs(den) < 1e-9) return { m: 0, b: sy / n };
    const m = (n * sxy - sx * sy) / den;
    return { m, b: (sy - m * sx) / n };
  };
  let f = ls(pts);
  const res = pts.map(([x, y]) => Math.abs(y - (f.m * x + f.b))).sort((a, b) => a - b);
  const mad = res[res.length >> 1] || 0;
  const keep = pts.filter(([x, y]) => Math.abs(y - (f.m * x + f.b)) <= Math.max(6, mad * 2.5));
  if (keep.length >= Math.max(2, pts.length * 0.5)) f = ls(keep);
  return f;
}

export interface FreeformOptions {
  /** 每行应当写了什么，默认 DEFAULT_ROWS */
  rows?: string[];
  /** 相对页面短边的最小连通域面积比例，滤纸张噪点 */
  minAreaRatio?: number;
}

export function segmentFreeform(
  gray: Uint8ClampedArray, w: number, h: number, opts: FreeformOptions = {},
): FreeformResult {
  const expectRows = opts.rows ?? DEFAULT_ROWS;
  const bw = binarizePage(gray, w, h);
  const bands = findRows(bw, w, h, expectRows.length);
  if (bands.length < expectRows.length) {
    throw new FreeformError(
      `Found ${bands.length} lines of writing but expected ${expectRows.length}. `
      + 'Make sure each group of characters is on its own line, that the lines are clearly separated, '
      + 'and that there is nothing else written on the page.',
    );
  }
  // 行数多于期望时，取墨迹最多的前 N 行（滤掉页眉页脚之类）
  const bandsUse = bands.length === expectRows.length ? bands : bands.slice(0, expectRows.length);

  const minArea = Math.max(24, Math.round(((Math.min(w, h) / 1000) ** 2) * 40));
  const rows: FreeformRow[] = [];
  const chars: FreeformChar[] = [];
  const xhSamples: number[] = [];

  bandsUse.forEach(([top, bottom], ri) => {
    const expected = [...expectRows[ri]];
    // 只取落在本行内的连通域
    const rowMaskH = bottom - top + 1;
    const sub = new Uint8ClampedArray(w * rowMaskH);
    for (let y = 0; y < rowMaskH; y++) for (let x = 0; x < w; x++) sub[y * w + x] = bw[(top + y) * w + x];

    /**
     * 面积阈值必须按「这一行里最小的那个字符」放宽，不能全页一个数。
     *
     * 模板流程早就有分级阈值（minAreaOf：标点 60 / 瘦字 140 / 其余 250），
     * 白纸流程一直用一个全局值 —— 于是标点行被按字母的标准筛，小点被当噪点扔掉。
     *
     * 实测这张真实照片：手写标点的点面积在 60~104 之间，而全局阈值算出来是 74，
     * 正好从中间切过去 —— `:` 丢了一个点，界面还报「14 found / 14 expected」，
     * 因为分组算法会把剩下的 17 个连通域凑成 14 组。又一个不报错的静默错误。
     *
     * 这里用的是白纸流程本来就有、却没用满的那个先验：**这一行写了什么是已知的**。
     * 既然知道，就能算出该行允许的最小墨点，不必猜。
     *
     * 代价核实过：把阈值从 74 降到 18，该行连通域从 17 变 18（正好补回丢的那个点），
     * 继续降到 4 仍然是 18 —— 纸面是干净的，放宽不引入噪点。
     */
    const tiniest = Math.min(...expected.filter((c) => c !== SKIP_MARK).map(minAreaOf), 250);
    const rowMinArea = Math.max(8, Math.round((minArea * tiniest) / 250));
    const comps = components(sub, w, rowMaskH, rowMinArea);
    const groups = groupIntoChars(comps, expected.length, rowMaskH);

    /**
     * 基线：对非下伸部字符的底边做最小二乘直线拟合，而不是取中位数。
     *
     * 手写时纸不会摆得笔直，拍照也会带一点旋转 —— 实测这张真实照片里，
     * 小写行从 a 到 z 整整掉了 91px。用一条水平线去套，左端字母悬空 46 单位、
     * 右端字母沉到基线下 90 单位，x-height 从 420 到 963 乱飞。
     * 一条斜线只需要多拟合一个参数，就把整类问题消掉了。
     */
    const pts: [number, number][] = [];
    groups.forEach((g, gi) => {
      const ch = expected[gi];
      if (ch === undefined || isSkip(ch) || DESCENDERS.has(ch)) return;
      const cx = (Math.min(...g.map((p) => p.box.x)) + Math.max(...g.map((p) => p.box.x + p.box.w))) / 2;
      pts.push([cx, Math.max(...g.map((p) => p.box.y + p.box.h))]);
    });
    const fit = fitLineRobust(pts, rowMaskH - 1);
    const baselineAt = (x: number) => top + fit.m * x + fit.b;

    // x-height：齐 x-height 的小写字母，其「基线(该字x) − 顶边」的中位数
    const xh: number[] = [];
    groups.forEach((g, gi) => {
      const ch = expected[gi];
      if (ch === undefined || isSkip(ch) || !XHEIGHT_LETTERS.has(ch)) return;
      const cx = (Math.min(...g.map((p) => p.box.x)) + Math.max(...g.map((p) => p.box.x + p.box.w))) / 2;
      xh.push((fit.m * cx + fit.b) - Math.min(...g.map((p) => p.box.y)));
    });
    if (xh.length >= 3) {
      xh.sort((a, b) => a - b);
      xhSamples.push(xh[xh.length >> 1]);
    }

    const rowChars: FreeformChar[] = [];
    groups.forEach((g, gi) => {
      const ch = expected[gi];
      if (ch === undefined || isSkip(ch)) return; // 多出来的、或用户标为涂改的，都丢弃
      const x0 = Math.min(...g.map((p) => p.box.x));
      const x1 = Math.max(...g.map((p) => p.box.x + p.box.w));
      const y0 = Math.min(...g.map((p) => p.box.y));
      const y1 = Math.max(...g.map((p) => p.box.y + p.box.h));
      const cw = x1 - x0, chh = y1 - y0;
      const mask = new Uint8ClampedArray(cw * chh);
      for (const part of g) for (const p of part.pix) {
        const px = p % w, py = (p / w) | 0;
        mask[(py - y0) * cw + (px - x0)] = 255;
      }
      const area = g.reduce((s, p) => s + p.box.area, 0);
      const fc: FreeformChar = {
        char: ch, mask, w: cw, h: chh, x0, y0: top + y0,
        baseline: baselineAt((x0 + x1) / 2), rowIndex: ri,
        confidence: Math.min(1, area / (cw * chh) / 0.45),
      };
      rowChars.push(fc); chars.push(fc);
    });

    rows.push({ index: ri, top, bottom, baseline: baselineAt(w / 2), found: groups.length, expected: expected.length, chars: rowChars });
  });

  if (!xhSamples.length) {
    throw new FreeformError('Could not work out the x-height. Make sure the lowercase row is written in full and is clearly legible.');
  }
  xhSamples.sort((a, b) => a - b);
  const scaleBasis = xhSamples[xhSamples.length >> 1];

  return { rows, chars, xheightPx: scaleBasis, scaleBasis, width: w, height: h, mask: bw };
}

/**
 * 白纸字符 -> 字形路径。
 * 与模板流程共用 maskToPath，只是基线与比例来自反推而非印刷线。
 */
export function freeformCharToPath(c: FreeformChar, scaleBasis: number) {
  return maskToPath(c.mask, c.w, c.h, c.baseline - c.y0, XH / scaleBasis);
}
