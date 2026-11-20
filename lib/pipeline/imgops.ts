// 纯浏览器可用的图像算子：只依赖 Uint8Array / Float32Array，无 Node API。
// 浏览器里灰度数据来自 ctx.getImageData()，Node 里来自 jpeg-js/pngjs —— 之后的代码完全相同。

/** RGBA -> 灰度 */
export function toGray(rgba: Uint8ClampedArray, w: number, h: number) {
  const g = new Uint8ClampedArray(w * h);
  for (let i = 0, j = 0; i < g.length; i++, j += 4) {
    g[i] = (rgba[j] * 299 + rgba[j + 1] * 587 + rgba[j + 2] * 114) / 1000;
  }
  return g;
}

/** 单次盒式模糊（可分离，行列各一遍，运行和 O(n)） */
function boxBlur(src: ArrayLike<number>, w: number, h: number, r: number) {
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
  const d = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let sum = 0;
    for (let i = -r; i <= r; i++) sum += src[row + Math.min(w - 1, Math.max(0, i))];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = sum / d;
      sum -= src[row + Math.min(w - 1, Math.max(0, x - r))];
      sum += src[row + Math.min(w - 1, Math.max(0, x + r + 1))];
    }
  }
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let i = -r; i <= r; i++) sum += tmp[Math.min(h - 1, Math.max(0, i)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = sum / d;
      sum -= tmp[Math.min(h - 1, Math.max(0, y - r)) * w + x];
      sum += tmp[Math.min(h - 1, Math.max(0, y + r + 1)) * w + x];
    }
  }
  return out;
}

/**
 * 高斯模糊的三次盒式近似。
 * 管线铁律 2：必须用 GaussianBlur(σ=45) 估背景再 divide 平场，
 * 不能用 adaptiveThreshold（窗口小于笔画宽度会把粗笔画掏空）。
 * 三次盒式模糊在 σ≥10 时与真高斯的差异远小于本步骤的容差（只是估背景）。
 */
export function gaussianApprox(src: ArrayLike<number>, w: number, h: number, sigma: number) {
  const boxW = Math.sqrt((12 * sigma * sigma) / 3 + 1);
  const r = Math.max(1, Math.round((boxW - 1) / 2));
  let cur = src;
  for (let i = 0; i < 3; i++) cur = boxBlur(cur, w, h, r);
  return cur;
}

/** cv2.divide(cell, bg, scale=255) —— 平场校正 */
export function divide(src: Uint8ClampedArray, bg: ArrayLike<number>, scale = 255) {
  const out = new Uint8ClampedArray(src.length);
  for (let i = 0; i < src.length; i++) {
    out[i] = bg[i] < 1e-6 ? 255 : Math.min(255, Math.round((src[i] * scale) / bg[i]));
  }
  return out;
}

/** 全局 Otsu 阈值 */
export function otsu(src: Uint8ClampedArray) {
  const hist = new Float64Array(256);
  for (let i = 0; i < src.length; i++) hist[src[i]]++;
  const total = src.length;
  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * hist[t];
  let sumB = 0, wB = 0, best = 0, thr = 0;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB, mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > best) { best = between; thr = t; }
  }
  return thr;
}

/** THRESH_BINARY_INV：墨迹(暗) -> 255 */
export function thresholdInv(src: Uint8ClampedArray, thr: number) {
  const out = new Uint8ClampedArray(src.length);
  for (let i = 0; i < src.length; i++) out[i] = src[i] <= thr ? 255 : 0;
  return out;
}

function morph(src: Uint8ClampedArray, w: number, h: number, k: number, dilate: boolean) {
  const r = (k - 1) >> 1, out = new Uint8ClampedArray(src.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = dilate ? 0 : 255;
      for (let dy = -r; dy <= r; dy++) {
        const yy = y + dy; if (yy < 0 || yy >= h) { if (!dilate) v = 0; continue; }
        for (let dx = -r; dx <= r; dx++) {
          const xx = x + dx; if (xx < 0 || xx >= w) { if (!dilate) v = 0; continue; }
          const s = src[yy * w + xx];
          v = dilate ? Math.max(v, s) : Math.min(v, s);
        }
      }
      out[y * w + x] = v;
    }
  }
  return out;
}
export const erode = (s: Uint8ClampedArray, w: number, h: number, k: number) => morph(s, w, h, k, false);
export const dilate = (s: Uint8ClampedArray, w: number, h: number, k: number) => morph(s, w, h, k, true);
export const open = (s: Uint8ClampedArray, w: number, h: number, k: number) => dilate(erode(s, w, h, k), w, h, k);
export const close = (s: Uint8ClampedArray, w: number, h: number, k: number) => erode(dilate(s, w, h, k), w, h, k);

export interface CompBox { x: number; y: number; w: number; h: number; area: number }

/**
 * 连通域标记 + 面积过滤（等价 connectedComponentsWithStats + area>minArea）。
 * reject 让调用方按形状再筛一道 —— 模板的基线参考线在淡墨照片里会挺过 Otsu，
 * 而它的形状（横贯整格、极扁）没有任何手写字符会长成那样。
 */
export function filterComponents(
  bw: Uint8ClampedArray, w: number, h: number, minArea: number,
  reject?: (b: CompBox) => boolean,
) {
  const lab = new Int32Array(w * h).fill(-1);
  const stack = new Int32Array(w * h);
  const keep = new Uint8ClampedArray(w * h);
  const comps: { pix: number[]; box: CompBox }[] = [];
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
    comps.push({ pix, box: { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, area: pix.length } });
    next++;
  }
  let kept = 0, dropped = 0;
  for (const { pix, box } of comps) {
    if (pix.length <= minArea) continue;
    if (reject?.(box)) { dropped++; continue; }
    kept++;
    for (const p of pix) keep[p] = 255;
  }
  return { keep, kept, dropped, total: comps.length };
}

/** 从 N 组点对求单应矩阵（DLT + 高斯消元解 8 元线性方程组） */
export function findHomography(src: number[][], dst: number[][]): number[] {
  const n = src.length;
  const A: number[][] = [], b: number[] = [];
  for (let i = 0; i < n; i++) {
    const [x, y] = src[i], [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -x * u, -y * u]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -x * v, -y * v]); b.push(v);
  }
  // 最小二乘正规方程 AᵀA h = Aᵀb
  const M = Array.from({ length: 8 }, () => new Float64Array(9));
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) { let s = 0; for (let k = 0; k < A.length; k++) s += A[k][i] * A[k][j]; M[i][j] = s; }
    let s = 0; for (let k = 0; k < A.length; k++) s += A[k][i] * b[k]; M[i][8] = s;
  }
  for (let c = 0; c < 8; c++) {
    let piv = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    [M[c], M[piv]] = [M[piv], M[c]];
    const d = M[c][c];
    for (let j = c; j <= 8; j++) M[c][j] /= d;
    for (let r = 0; r < 8; r++) {
      if (r === c) continue;
      const f = M[r][c];
      for (let j = c; j <= 8; j++) M[r][j] -= f * M[c][j];
    }
  }
  return [M[0][8], M[1][8], M[2][8], M[3][8], M[4][8], M[5][8], M[6][8], M[7][8], 1];
}

function invert3(H: number[]) {
  const [a, b, c, d, e, f, g, h, i] = H;
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  return [
    (e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det,
    (f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det,
    (d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det,
  ];
}

/** 透视重采样（双线性），等价 cv2.warpPerspective */
export function warpPerspective(src: Uint8ClampedArray, sw: number, sh: number, H: number[], dw: number, dh: number) {
  const Hi = invert3(H);
  const out = new Uint8ClampedArray(dw * dh);
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const w0 = Hi[6] * x + Hi[7] * y + Hi[8];
      const sx = (Hi[0] * x + Hi[1] * y + Hi[2]) / w0;
      const sy = (Hi[3] * x + Hi[4] * y + Hi[5]) / w0;
      if (sx < 0 || sy < 0 || sx >= sw - 1 || sy >= sh - 1) { out[y * dw + x] = 140; continue; }
      const x0 = sx | 0, y0 = sy | 0, fx = sx - x0, fy = sy - y0;
      const p00 = src[y0 * sw + x0], p10 = src[y0 * sw + x0 + 1];
      const p01 = src[(y0 + 1) * sw + x0], p11 = src[(y0 + 1) * sw + x0 + 1];
      out[y * dw + x] = p00 * (1 - fx) * (1 - fy) + p10 * fx * (1 - fy) + p01 * (1 - fx) * fy + p11 * fx * fy;
    }
  }
  return out;
}

/** 裁剪子区域 */
export function crop(src: Uint8ClampedArray, sw: number, sh: number, x0: number, y0: number, w: number, h: number) {
  const out = new Uint8ClampedArray(w * h);
  for (let y = 0; y < h; y++) {
    const sy = Math.min(sh - 1, y0 + y);
    for (let x = 0; x < w; x++) out[y * w + x] = src[sy * sw + Math.min(sw - 1, x0 + x)];
  }
  return out;
}
