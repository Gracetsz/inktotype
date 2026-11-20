'use client';
/** 主线程侧的 Worker 封装：图片解码 + 单次请求 Promise 化 + 进度回调 */
import type { WorkerRequest, WorkerResponse, CellSummary, FreeformRowSummary } from './worker';
import type { ManualCorners } from './pipeline';

export type { CellSummary, ManualCorners };
export type Progress = { phase: string; done: number; total: number };

let worker: Worker | null = null;
function getWorker(): Worker {
  if (!worker) worker = new Worker(new URL('./worker.ts', import.meta.url));
  return worker;
}
export function resetWorker() {
  worker?.terminate();
  worker = null;
}

function once<T extends WorkerResponse['type']>(
  req: WorkerRequest,
  want: T,
  onProgress?: (p: Progress) => void,
  transfer?: Transferable[],
): Promise<Extract<WorkerResponse, { type: T }>> {
  return new Promise((resolve, reject) => {
    const w = getWorker();
    const handler = (e: MessageEvent<WorkerResponse>) => {
      const m = e.data;
      if (m.type === 'progress') return onProgress?.(m);
      w.removeEventListener('message', handler);
      if (m.type === want) resolve(m as any);
      else if (m.type === 'needsManualCorners') reject(Object.assign(new Error(m.message), { needsManualCorners: true }));
      else if (m.type === 'error') reject(new Error(m.message));
      else reject(new Error(`Unexpected response from the worker: ${m.type}`));
    };
    w.addEventListener('message', handler);
    w.postMessage(req, transfer ?? []);
  });
}

/** 解码任意图片文件为 RGBA。走 createImageBitmap 原生解码，并把长边压到 3000px。 */
export async function decodeImage(file: File | Blob, maxSide = 3000) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const canvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(w, h)
    : Object.assign(document.createElement('canvas'), { width: w, height: h });
  const ctx = (canvas as any).getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  const img = ctx.getImageData(0, 0, w, h);
  return { rgba: img.data as Uint8ClampedArray, width: w, height: h };
}

export async function processPhoto(
  img: { rgba: Uint8ClampedArray; width: number; height: number },
  opts: { manual?: ManualCorners; onProgress?: (p: Progress) => void } = {},
) {
  return once(
    { type: 'process', rgba: img.rgba, width: img.width, height: img.height, manual: opts.manual },
    'processed', opts.onProgress,
  );
}

export async function buildFontFile(
  fontName: string,
  overrides: Record<string, { mask: Uint8ClampedArray; w: number; h: number; y0c: number }> = {},
  onProgress?: (p: Progress) => void,
) {
  return once({ type: 'build', fontName, overrides }, 'built', onProgress);
}

/** 掩膜 -> 可显示的 canvas（字形网格与单格编辑都用它） */
export function maskToCanvas(mask: Uint8ClampedArray, w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  for (let i = 0, j = 0; i < mask.length; i++, j += 4) {
    const ink = mask[i] > 0;
    img.data[j] = ink ? 0x43 : 255;
    img.data[j + 1] = ink ? 0x26 : 255;
    img.data[j + 2] = ink ? 0x7a : 255;
    img.data[j + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/** canvas -> 掩膜（单格重写后回灌管线） */
export function canvasToMask(c: HTMLCanvasElement): Uint8ClampedArray {
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  const mask = new Uint8ClampedArray(c.width * c.height);
  for (let i = 0, j = 0; i < mask.length; i++, j += 4) {
    // 白底黑笔：亮度低于阈值即墨迹
    mask[i] = d[j + 3] > 40 && (d[j] * 299 + d[j + 1] * 587 + d[j + 2] * 114) / 1000 < 160 ? 255 : 0;
  }
  return mask;
}

/* ---------- 白纸流程（/font-from-image/） ---------- */
export type { FreeformRowSummary };

export async function processFreeform(
  img: { rgba: Uint8ClampedArray; width: number; height: number },
  rows: string[],
  onProgress?: (p: Progress) => void,
) {
  return once({ type: 'processFreeform', rgba: img.rgba, width: img.width, height: img.height, rows },
    'freeformProcessed', onProgress);
}

export async function buildFreeformFont(fontName: string, onProgress?: (p: Progress) => void) {
  return once({ type: 'buildFreeform', fontName }, 'built', onProgress);
}

/* ---------- 浏览器直写（/draw/） ---------- */
export async function buildFromMasks(
  fontName: string,
  items: { char: string; mask: Uint8ClampedArray; w: number; h: number }[],
  baselineY: number, xheightY: number,
  onProgress?: (p: Progress) => void,
) {
  return once({ type: 'buildMasks', fontName, items, baselineY, xheightY }, 'built', onProgress);
}
