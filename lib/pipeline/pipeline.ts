/**
 * 管线主体：校正 -> 切格 -> 二值化 -> 描摹 -> 装配 TTF
 * 全部只用浏览器可用 API。经 spike 验证：12 张退化照片中 11 张有效用例全部 76/76 等效通过，
 * 端到端 ~1.2s（62 格），详见 ../../../spike-报告-后端是否需要存在.md
 */
import {
  gaussianApprox, divide, otsu, thresholdInv, open, close,
  filterComponents, findHomography, warpPerspective, crop,
} from './imgops';
import { detectMarkers } from './markers';
import { buildLayout, markerOrigins, minAreaOf, coverageRangeOf, LABEL, TPL, type Cell, type Layout } from '../template';
import ImageTracer from 'imagetracerjs';
import opentype from 'opentype.js';

export const UPM = 1000;
export const XH = 500;
export const SB = 35;
/** 垂直度量三组统一 —— README v4 P0 #4。基线实现里 win 与 typo 不一致，是既有缺陷。 */
export const ASCENT = 900;
export const DESCENT = -350;

export class RectifyError extends Error {
  constructor(message: string, readonly needsManualCorners = true) {
    super(message);
    this.name = 'RectifyError';
  }
}

/** 手动兜底时前端传进来的纸张四角（照片坐标，顺序 左上/右上/右下/左下） */
export type ManualCorners = [number, number][];

export function rectify(
  gray: Uint8ClampedArray, sw: number, sh: number, manual?: ManualCorners,
): Uint8ClampedArray {
  const { W, H, MARK, PAD } = TPL;
  let srcPts: number[][], dstPts: number[][];

  if (manual && manual.length === 4) {
    // 用户点的是纸的四角，对应模板的四角（0,0)-(W,H)
    srcPts = manual.map(([x, y]) => [x, y]);
    dstPts = [[0, 0], [W, 0], [W, H], [0, H]];
  } else {
    const quads = detectMarkers(gray, sw, sh, MARK, W);
    srcPts = []; dstPts = [];
    markerOrigins().forEach(([x, y], i) => {
      const tgt = [[x, y], [x + MARK, y], [x + MARK, y + MARK], [x, y + MARK]];
      quads[i].forEach((p, j) => { srcPts.push(p); dstPts.push(tgt[j]); });
    });
  }

  const Hm = findHomography(srcPts, dstPts);
  const rect = warpPerspective(gray, sw, sh, Hm, W, H);
  if (!manual) verifyRectified(rect, W, H, MARK, PAD);
  return rect;
}

/**
 * 校正后自检 —— spike 逼出来的 P0。
 * 失败模式：标记检测「成功」但选中了错误的暗色块（纸没拍全时格线会被误认），
 * 单应轻微偏移、切格悄悄丢几个字，全程不报错，最后交付一套缺字母的字体。
 * 唯一可靠判据：校正之后四个标记必须真的落在模板规定的位置上。
 */
function verifyRectified(rect: Uint8ClampedArray, W: number, H: number, MARK: number, PAD: number) {
  const bad: string[] = [];
  const names = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];
  markerOrigins().forEach(([x, y], i) => {
    /**
     * 判据是「黑色像素占比」，不是「区域平均灰度」。
     *
     * 原先用平均灰度 ≤ 175，漏掉了真实的失败案例：一张裁掉四角标记的照片，
     * 管线挑了四个手写字母当标记，校正后四个标记位的黑色占比只有
     * 0.355 / 0.553 / 0.875 / 0.731 —— 但平均灰度约 159，低于 175，顺利放行。
     * 大片白底会把平均值稀释，笔画的浓黑救不回来；占比不受这个影响。
     *
     * 内缩 12px 是为了避开 warp 出来的边缘抗锯齿过渡带。
     * 实测：三份正常样本（真实照片 + 两份合成图）四角占比全部 1.000，
     * 那张失败照片最低 0.355。0.85 两边都有巨大余量。
     */
    const IN = 12;
    let dark = 0, n = 0;
    for (let yy = y + IN; yy < y + MARK - IN; yy += 2) {
      for (let xx = x + IN; xx < x + MARK - IN; xx += 2) { n++; if (rect[yy * W + xx] < 128) dark++; }
    }
    const frac = dark / Math.max(1, n);
    if (frac < 0.85) bad.push(`${names[i]}(${(frac * 100).toFixed(0)}%)`);
  });
  if (bad.length) {
    throw new RectifyError(
      `The ${bad.join(', ')} corner marker does not line up (the percentage is how black that spot is — it should be close to 100%). `
      + 'Usually the whole sheet is not in the frame, or a black square is covered by a finger or a shadow. '
      + 'Retake the photo with all four squares fully visible, or mark the four corners of the sheet by hand.',
    );
  }
}

export interface CellResult {
  char: string;
  /** 墨迹掩膜，255=墨 */
  mask: Uint8ClampedArray;
  w: number; h: number;
  /** 裁切区在模板坐标里的原点，度量对齐要用 */
  y0c: number;
  coverage: number;
  /** 0–1，越低越可疑，前端据此标红 */
  confidence: number;
  status: 'ok' | 'empty' | 'overflow' | 'faint';
}

/** 步骤 3b：单格切割 + 平场 + Otsu + 形态学 + 连通域过滤 + 质检评分 */
export function segmentCell(rect: Uint8ClampedArray, c: Cell): CellResult {
  const { W, H } = TPL;
  /**
   * 裁切区必须夹在格框内侧。
   * 原来上下左右各外扩 30/40/20/20 是为了容纳上升部与下伸部，但格框本身
   * 就落在那圈外扩里 —— 对字母无所谓（面积阈值 250 滤掉了），
   * 对标点致命：阈值降到 60 之后，格框边线和相邻格的框线全部被当成墨迹放行。
   * 实测 76 格里 `'` 一格切出 12 个连通域，真正的撇号只占其中 1 个。
   */
  const IN = 6; // 框线内侧留白
  const y0c = Math.max(c.y - 30, c.boxY + IN);
  const x0c = Math.max(c.x - 20, c.boxX + IN);
  const cw = Math.min(c.x + c.w + 20, c.boxX + c.boxW - IN, W) - x0c;
  const ch = Math.min(c.y + c.h + 40, c.boxY + c.boxH - IN, H) - y0c;
  const cell = crop(rect, W, H, x0c, y0c, cw, ch);

  /**
   * 把格内左上角的印刷标签涂白。
   *
   * 切割窗左边缘在格框 +36，标签墨迹横跨 +14 到 +43 —— 重叠 7px。
   * 不涂掉的话，那道 7px 宽的竖条会被二值化当成墨迹、被连通域保留，
   * 最后装进字体：每个字母右上角挂着一小截别的字符的残片。
   * 真实测试里 76 格全部"成功"、字体能装能用，只是每个字都带一个小黑点 ——
   * 又一个不会报错的静默错误。
   *
   * 涂白区宽 52 < 可书写区起点 56，所以碰不到用户真正写的字。
   */
  {
    const lx = Math.max(0, c.boxX - x0c);
    const ly = Math.max(0, c.boxY - y0c);
    const lw = Math.min(cw, c.boxX + LABEL.clearW - x0c);
    const lh = Math.min(ch, c.boxY + LABEL.clearH - y0c);
    for (let y = ly; y < lh; y++) for (let x = lx; x < lw; x++) cell[y * cw + x] = 255;
  }

  const bg = gaussianApprox(cell, cw, ch, 45);
  const flat = divide(cell, bg);
  let bw = thresholdInv(flat, otsu(flat));
  bw = open(bw, cw, ch, 3);
  bw = close(bw, cw, ch, 5);
  /**
   * 再滤一道形状：横贯整格且极扁的连通域是模板的基线/x-height 参考线。
   * 淡墨照片里 Otsu 阈值抬高，浅灰参考线会挺过二值化。
   * 只滤「宽而扁」不滤「高而窄」—— 后者会误杀 l / 1 / I / ( 这些真字符。
   */
  const isRuledLine = (b: { w: number; h: number }) => b.w > cw * 0.7 && b.h < ch * 0.09;
  const { keep } = filterComponents(bw, cw, ch, minAreaOf(c.char), isRuledLine);

  let ink = 0;
  for (let i = 0; i < keep.length; i++) if (keep[i]) ink++;
  const coverage = ink / keep.length;

  // 合格区间按字符类型分级：句号本来就只占格子 ~1%，用字母的下限去判会整片误杀
  const [lo, hi] = coverageRangeOf(c.char);
  let status: CellResult['status'] = 'ok';
  if (coverage <= lo * 0.35) status = 'empty';
  else if (coverage < lo) status = 'faint';
  else if (coverage >= hi) status = 'overflow';

  // 置信度：覆盖率落在该字符理想带中央最高，越靠边越低
  const mid = lo + (hi - lo) * 0.15;
  const confidence = status !== 'ok' ? 0
    : coverage < mid
      ? 0.5 + 0.5 * ((coverage - lo) / (mid - lo))
      : 0.5 + 0.5 * ((hi - coverage) / (hi - mid));

  return { char: c.char, mask: keep, w: cw, h: ch, y0c, coverage, confidence: Math.max(0, Math.min(1, confidence)), status };
}

/** 步骤 4a：描摹。imagetracerjs（Unlicense）直接输出二次曲线，正是 TrueType 要的，无需 cu2qu。 */
function traceContours(bin: Uint8ClampedArray, w: number, h: number) {
  const rgba = new Uint8ClampedArray(w * h * 4);
  for (let i = 0, j = 0; i < bin.length; i++, j += 4) {
    const v = bin[i] ? 0 : 255;
    rgba[j] = rgba[j + 1] = rgba[j + 2] = v; rgba[j + 3] = 255;
  }
  const td = (ImageTracer as any).imagedataToTracedata({ data: rgba, width: w, height: h }, {
    ltres: 1, qtres: 1, pathomit: 8, rightangleenhance: false,
    pal: [{ r: 0, g: 0, b: 0, a: 255 }, { r: 255, g: 255, b: 255, a: 255 }],
    numberofcolors: 2, blurradius: 0, scale: 1, linefilter: false,
  });
  return (td.layers?.[0] ?? []) as any[];
}

function signedArea(pts: number[][]) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

function reverseSegs(segs: any[]) {
  const out: any[] = [];
  for (let i = segs.length - 1; i >= 0; i--) {
    const g = segs[i];
    if (g.type === 'Q') out.push({ type: 'Q', x1: g.x3, y1: g.y3, x2: g.x2, y2: g.y2, x3: g.x1, y3: g.y1 });
    else out.push({ type: 'L', x1: g.x2, y1: g.y2, x2: g.x1, y2: g.y1 });
  }
  return out;
}

/**
 * 从「无上升部也无下伸部」的小写字母里量出真实的基线与 x-height。
 *
 * 为什么不直接用印刷参考线：模板上基线到 x-height 线只有 77px，而格子高 275px。
 * 给人一个 275px 高的格子，人自然会把小写写到 110px 左右 —— 实测两位使用者的
 * 真实照片都是 1.4~1.5 倍，且整体压在基线以下约 26px。合成图之所以完美，
 * 恰恰因为它是程序照着参考线精确渲染的，人不会那么写。
 *
 * 后果不是"看起来歪"（同一套字体内部一致，σ 只有 24~50，观感很好），
 * 而是**跟别的字体混排时对不上**：同样字号下大 45%、整体沉在基线下 15%。
 *
 * 解法沿用白纸路线已经在用的那条原则：已知的先验不要猜。
 * 「哪些字母既不上升也不下伸」是已知的，那就量它们，别信印刷线。
 * 取中位数而非均值 —— 个别写飞的字母不该拖动整体度量。
 */
const FLAT = [...'acemnorsuvwxz'];

const median = (a: number[]) => {
  const s = [...a].sort((p, q) => p - q);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export interface InkMetrics {
  /** 真实基线相对印刷基线的偏移（模板像素，正数=写到了线下） */
  baselineShift: number;
  /** 真实 x-height 高度（模板像素） */
  xheightPx: number;
}

export function measureInk(segs: Map<string, CellResult>, layout: Layout): InkMetrics {
  const bottoms: number[] = [], heights: number[] = [];
  for (const ch of FLAT) {
    const seg = segs.get(ch);
    if (!seg || seg.status !== 'ok') continue;
    let minY = -1, maxY = -1;
    for (let y = 0; y < seg.h; y++) {
      let hasInk = false;
      for (let x = 0; x < seg.w; x++) if (seg.mask[y * seg.w + x]) { hasInk = true; break; }
      if (!hasInk) continue;
      if (minY < 0) minY = y;
      maxY = y;
    }
    if (maxY < 0) continue;
    const c = layout.cells[ch];
    bottoms.push(seg.y0c + maxY - c.baseline);
    heights.push(maxY - minY);
  }
  // 样本不足时退回印刷参考线 —— 宁可用旧行为，也不要用两三个字母算出的度量
  if (bottoms.length < 5) {
    const c = layout.cells['a'];
    return { baselineShift: 0, xheightPx: c.baseline - c.xheight };
  }
  return { baselineShift: median(bottoms), xheightPx: median(heights) };
}

/**
 * 步骤 4b：单格 -> 字形路径
 * 度量铁律：全局统一比例，y = (基线 - 像素y) * s。下伸部自然为负。
 * 禁止逐字形 bbox 归一化 —— 那是小写写不对的根因。
 *
 * @param ink 由 measureInk 量出的真实度量。不传则退回印刷参考线（旧行为）。
 */
export function cellToPath(seg: CellResult, c: Cell, ink?: InkMetrics) {
  const baseRel = c.baseline - seg.y0c + (ink?.baselineShift ?? 0);
  const xhPx = ink?.xheightPx ?? (c.baseline - c.xheight);
  return maskToPath(seg.mask, seg.w, seg.h, baseRel, XH / xhPx);
}

/**
 * 掩膜 -> 字形路径。模板流程与白纸流程共用。
 * @param baseRel 基线在掩膜坐标里的 y
 * @param s       全局统一比例（500 字体单位 / 基线到 x-height 的像素距离）
 *
 * 两条流程唯一的区别只是这两个参数怎么来的：
 * 模板流程从印刷的辅助线直接读，白纸流程从整行字形反推。之后的处理完全相同。
 */
export function maskToPath(mask: Uint8ClampedArray, w: number, h: number, baseRel: number, s: number) {
  let x0 = Infinity, x1 = -Infinity;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (mask[y * w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
  }
  if (x0 === Infinity) return null;

  const T = (px: number, py: number): [number, number] => [SB + (px - x0) * s, (baseRel - py) * s];

  const path = new opentype.Path();
  for (const sub of traceContours(mask, w, h)) {
    const segs = sub.segments;
    if (!segs || segs.length < 2) continue;
    const poly = [T(segs[0].x1, segs[0].y1)];
    for (const g of segs) poly.push(g.type === 'Q' ? T(g.x3, g.y3) : T(g.x2, g.y2));
    const isCW = signedArea(poly) < 0;
    const ordered = isCW === !sub.isholepath ? segs : reverseSegs(segs);

    const [sx, sy] = T(ordered[0].x1, ordered[0].y1);
    path.moveTo(sx, sy);
    for (const g of ordered) {
      if (g.type === 'Q') {
        const [cx, cy] = T(g.x2, g.y2), [ex, ey] = T(g.x3, g.y3);
        path.quadraticCurveTo(cx, cy, ex, ey);
      } else {
        const [ex, ey] = T(g.x2, g.y2);
        path.lineTo(ex, ey);
      }
    }
    path.close();
  }
  return { path, advance: Math.round((x1 - x0 + 1) * s) + 2 * SB };
}

export interface GlyphInput { char: string; path: any; advance: number }

const glyphName = (c: string) => {
  if (/[A-Z]/.test(c)) return c;
  if (/[a-z]/.test(c)) return `${c}.lc`;
  if (/[0-9]/.test(c)) return `d${c}`;
  return `uni${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`;
};

/**
 * 步骤 4c：装配 TTF。
 *
 * 两条铁律，缺一不可：
 * 1. hhea 与 OS/2 typo/win 三组 ascent/descent 必须一致，否则 Word 与 Photoshop 行高不同。
 * 2. 度量必须包住最高与最低的字形。写死常数是错的 —— Python 基线把 descent 定死 -320，
 *    而 y 的最低点是 -334，笔尖在部分渲染器里被裁掉；这里引号顶到 1045，也会撞破 900。
 *    手写的高矮因人而异，度量只能从实际字形推。
 */
export function buildFont(glyphData: GlyphInput[], familyName = 'MyHandwriting') {
  const safeName = (familyName.replace(/[^\w \-]/g, '').trim() || 'MyHandwriting').slice(0, 40);

  let top = ASCENT, bottom = DESCENT;
  for (const g of glyphData) {
    const bb = (g.path as any).getBoundingBox?.();
    if (!bb || !isFinite(bb.y1) || !isFinite(bb.y2)) continue;
    top = Math.max(top, bb.y2);
    bottom = Math.min(bottom, bb.y1);
  }
  const asc = Math.ceil(top / 10) * 10 + 20;
  const desc = Math.floor(bottom / 10) * 10 - 20;
  const glyphs = [
    new opentype.Glyph({ name: '.notdef', unicode: 0, advanceWidth: 500, path: new opentype.Path() }),
    new opentype.Glyph({ name: 'space', unicode: 32, advanceWidth: 280, path: new opentype.Path() }),
  ];
  for (const g of glyphData) {
    glyphs.push(new opentype.Glyph({
      name: glyphName(g.char), unicode: g.char.charCodeAt(0), advanceWidth: g.advance, path: g.path,
    }));
  }
  const font = new opentype.Font({
    familyName: safeName, styleName: 'Regular', unitsPerEm: UPM, ascender: asc, descender: desc, glyphs,
  });
  const t: any = font.tables;
  if (t.os2) {
    t.os2.sTypoAscender = asc; t.os2.sTypoDescender = desc; t.os2.sTypoLineGap = 0;
    t.os2.usWinAscent = asc; t.os2.usWinDescent = -desc; t.os2.fsSelection = 0x40;
  }
  if (t.hhea) { t.hhea.ascender = asc; t.hhea.descender = desc; t.hhea.lineGap = 0; }
  return font;
}

export { buildLayout };
export type { Layout, Cell };
