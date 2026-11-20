// 四角定位标记检测 —— 不依赖 opencv.js contrib（标准 opencv.js 不含 aruco 模块）。
// 做法：降采样 -> 平场 -> Otsu -> 连通域 -> 按面积/方正度/靠近页角筛出 4 个标记 -> 取每个标记的四角。
// 这也顺带证明了一件事：模板的定位标记不必是 ArUco，四个实心黑方块即可。
import { gaussianApprox, divide, otsu, thresholdInv } from './imgops';

function downsample(src: Uint8ClampedArray, w: number, h: number, f: number) {
  const dw = Math.floor(w / f), dh = Math.floor(h / f);
  const out = new Uint8ClampedArray(dw * dh);
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
    let s = 0;
    for (let j = 0; j < f; j++) for (let i = 0; i < f; i++) s += src[(y * f + j) * w + x * f + i];
    out[y * dw + x] = s / (f * f);
  }
  return { data: out, w: dw, h: dh };
}

/**
 * 凸四边形的四角，旋转不变。
 * 先前用「沿对角线取 x±y 极值」，那种做法只在标记近似正置时准确，
 * 照片旋转 15° 就会让角点偏移几个像素，进而污染单应、丢格（实测 58/62）。
 * 现在改成：离质心最远点 = A；离 A 最远点 = C；AC 两侧各取离直线最远点 = B/D。
 * 这一组只依赖点集几何，与旋转角无关。
 */
function quadCorners(pix: number[], w: number): number[][] {
  const pts = pix.map((p) => [p % w, (p / w) | 0]);
  let cx = 0, cy = 0;
  for (const [x, y] of pts) { cx += x; cy += y; }
  cx /= pts.length; cy /= pts.length;

  const farthestFrom = (px: number, py: number): number[] => {
    let best = pts[0], bd = -1;
    for (const q of pts) {
      const d = (q[0] - px) ** 2 + (q[1] - py) ** 2;
      if (d > bd) { bd = d; best = q; }
    }
    return best;
  };
  const A = farthestFrom(cx, cy);
  const C = farthestFrom(A[0], A[1]);

  // AC 直线的两侧各取距离最远的点
  const dx = C[0] - A[0], dy = C[1] - A[1];
  let B: number[] | null = null, D: number[] | null = null, bPos = 0, bNeg = 0;
  for (const q of pts) {
    const cross = dx * (q[1] - A[1]) - dy * (q[0] - A[0]);
    if (cross > bPos) { bPos = cross; B = q; }
    if (cross < bNeg) { bNeg = cross; D = q; }
  }
  if (!B || !D) return [A, A, C, C];

  // 按绕质心的极角排序，再旋转到「最靠左上者优先」，得到 TL,TR,BR,BL
  const quad = [A, B, C, D];
  quad.sort((p, q) => Math.atan2(p[1] - cy, p[0] - cx) - Math.atan2(q[1] - cy, q[0] - cx));
  let start = 0, bs = Infinity;
  quad.forEach((p, i) => { const s = p[0] + p[1]; if (s < bs) { bs = s; start = i; } });
  return [quad[start], quad[(start + 1) % 4], quad[(start + 2) % 4], quad[(start + 3) % 4]];
}

/**
 * 外接框填充率——**只是一道便宜的粗筛**，不是判据。
 *
 * 曾经试图用它来分辨"实心黑方块"和"粗体手写字母"，失败了，原因是几何的：
 * 一个实心正方形旋转 θ 角之后，外接框面积变成 (cosθ+sinθ)² 倍，
 * 填充率掉到 1/(cosθ+sinθ)² —— θ=15° 时就是 0.667。
 * 换句话说这个量测的是**拍照角度**，不是实心程度。实测：
 *
 *   真标记（真实照片，有倾斜）  0.649 – 0.785
 *   手写字母（另一张照片）      0.35  – 0.625
 *
 * 两条区间几乎贴在一起，无论阈值定在哪都会两头出错。
 * 试过改用「四角围成的四边形面积」做分母求实心度，同样失败：
 * 四角近似对非凸的字母失效，字母能算出 1.267，比真标记的 0.725 还高。
 *
 * 真正的判据放在了 pipeline.ts 的 rectify() 里：**校正之后再验**。
 * 单应矩阵会把选中的四块 warp 成轴对齐的正方形，旋转被消掉，
 * 真标记必然是一块实心黑，字母还是笔画。实测分离得非常干净（1.000 vs 0.355）。
 */
const MIN_FILL = 0.35;

/**
 * @returns {{corners: number[][][], order: string[]}} 4 个标记各自的 4 个角（原图坐标），
 *          顺序为 TL,TR,BR,BL 标记，每个标记内部也是 TL,TR,BR,BL 角。
 */
export function detectMarkers(gray: Uint8ClampedArray, W: number, H: number, markSizePx: number, templateW: number): number[][][] {
  // 照片分辨率不等于模板分辨率：标记的像素尺寸必须按实际缩放推算，
  // 否则 1200px 宽的照片里标记只有 ~87px，用模板的 180px 去筛会一个都找不到。
  const scale = W / templateW;
  const expectFull = markSizePx * scale;
  // 降采样到标记约 45px：既够找角点，又把连通域的开销压下来
  const factor = Math.min(8, Math.max(1, Math.round(expectFull / 45)));
  const { data, w, h } = downsample(gray, W, H, factor);
  const bg = gaussianApprox(data, w, h, Math.max(4, (45 * scale) / factor));
  const flat = divide(data, bg);
  const bw = thresholdInv(flat, otsu(flat));

  const expect = expectFull / factor;
  const lab = new Int32Array(w * h).fill(-1);
  const stack = new Int32Array(w * h);
  const cands: {pix:number[];cx:number;cy:number;size:number}[] = [];
  let next = 0;
  for (let i = 0; i < bw.length; i++) {
    if (bw[i] === 0 || lab[i] !== -1) continue;
    let sp = 0; stack[sp++] = i; lab[i] = next;
    const pix: number[] = [];
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    while (sp > 0) {
      const p = stack[--sp]; pix.push(p);
      const px = p % w, py = (p / w) | 0;
      if (px < minX) minX = px; if (px > maxX) maxX = px;
      if (py < minY) minY = py; if (py > maxY) maxY = py;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = px + dx, ny = py + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx;
        if (bw[q] !== 0 && lab[q] === -1) { lab[q] = next; stack[sp++] = q; }
      }
    }
    next++;
    const bwid = maxX - minX + 1, bhei = maxY - minY + 1;
    const aspect = bwid / bhei;
    const fill = pix.length / (bwid * bhei);
    // 标记特征：尺寸接近预期、近似正方、**几乎实心**
    if (bwid < expect * 0.55 || bwid > expect * 1.8) continue;
    if (aspect < 0.65 || aspect > 1.55) continue;
    if (fill < MIN_FILL) continue;
    cands.push({ pix, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, size: bwid * bhei });
  }
  if (cands.length < 4) {
    throw new Error(
      cands.length === 0
        ? 'We could not find the four corner markers in this photo. The usual causes: (1) this is not our template — '
          + 'for handwriting on plain paper use the no-printer route at /font-from-image/; (2) the whole sheet is not '
          + 'in the frame — all four black squares must be fully visible; (3) a corner was cut off by the printer margins.'
        : `Only ${cands.length} of the 4 corner markers were found. Usually one of the black squares is covered by a finger, `
          + `a shadow or a reflection. Retake the photo with the whole sheet flat and evenly lit.`,
    );
  }

  // 取最靠近四个页角的 4 个候选
  const targets = [[0, 0], [w, 0], [w, h], [0, h]];
  const picked = targets.map(([tx, ty]) => {
    let best: typeof cands[number] | null = null, bd = Infinity;
    for (const c of cands) {
      const d = (c.cx - tx) ** 2 + (c.cy - ty) ** 2;
      if (d < bd) { bd = d; best = c; }
    }
    return best!;
  });
  if (new Set(picked).size !== 4) throw new Error('Corner markers could not be matched to the four corners (the same square was picked twice). Retake the photo with the whole sheet in frame.');

  // 这里刻意不再做形状判断。选中的四块到底是不是标记，
  // 由 rectify() 在校正之后验证 —— 那时旋转已被消掉，判据才是可靠的。
  return picked.map((c) => quadCorners(c.pix, w).map(([x, y]: number[]) => [x * factor + factor / 2, y * factor + factor / 2]));
}
