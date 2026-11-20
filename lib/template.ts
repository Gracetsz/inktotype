/**
 * 模板几何 —— 全站唯一真源。
 * 打印页（HTML + @media print）和照片切割用的是同一份坐标，
 * 分开写两份必然漂移，那是丢格最隐蔽的来源。
 *
 * 坐标系沿用已验证的 m0-pipeline：A4 @300dpi = 2480 × 3508 px。
 * 打印时按 px/300*25.4 换成 mm；用户若把打印缩放设成 95%，
 * 单应矩阵会从四角标记里自动吸收掉这个比例，不影响结果。
 */

export const TPL = {
  W: 2480,
  H: 3508,
  MARK: 180, // 四角定位方块边长
  PAD: 110, // 页边到标记的距离
  COLS: 8,
  ROWS: 10,
} as const;

/**
 * 拉丁手写体的垂直比例，单位是 x-height 的倍数。
 *
 * 不是拍脑袋，也不是照某一份手写样本反推 —— 是把十款主流欧美手写字体
 * 装下来用 fontTools 实测的中位数（Caveat / Indie Flower / Patrick Hand /
 * Architects Daughter / Kalam / Shadows Into Light / Gloria Hallelujah /
 * Handlee / Permanent Marker / Homemade Apple）：
 *
 *   大写高 A–Z        中位 1.40×   区间 1.21 ~ 1.91
 *   上升部 b d h k l t 中位 1.51×   区间 1.00 ~ 1.93
 *   下伸部 g p q y     中位 -0.63×  区间 -1.27 ~ -0.02
 *   f 顶端            中位 1.61×   ← 全字母表最高，比大写和其他上升部都高
 *   f 底端            中位 ~0      ← 十款里八款的 f **不下伸**，只有连笔体才伸
 *   j 底端            中位 -0.64×  与其他下伸部一致
 *
 * 两个反直觉但一致的结论：**上升部比大写高**（1.51 > 1.40，这也是通行的
 * 排版惯例），以及 **f 不该被要求下伸**。
 */
export const RATIO = { cap: 1.40, asc: 1.51, desc: 0.63 } as const;

/** 需要上升部辅助线的小写字母。f 归在这里 —— 它更高一点，但不值得单开一条线。 */
export const ASCENDERS = new Set([...'bdfhklt']);
/** 需要下伸部辅助线的字母。注意不含 f。 */
export const DESCENDERS = new Set([...'gjpqy']);

/**
 * 基线与 x-height 线在格内的相对高度。
 *
 * 原值 baseline 0.72 / xheight 0.44，把格子切成
 *   上升区 121px : x-height 带 77px : 下伸区 77px = 1.57 : 1 : 1
 * 而实测比例要求的是 1.51 : 1 : 0.63。**上升区给多了一倍还多，
 * x-height 带只有该有的三分之二。** 带子在高格子里成了一道细缝，
 * 没人会拿它当参照，只会去填满格子 —— 这就是人把字写大的直接原因。
 *
 * 重排：可切割区是 y0c(+20) 到 crop 底(+269)，共 249px。
 * 一套字的总垂直跨度 = (1.51 + 0.63) × 带宽 = 2.14 × 带宽。
 * 取带宽 110px → 总跨度 235px，居中放进 249px，上下各留 7px：
 *
 *   上升顶 +27  ·  x-height 线 +83  ·  基线 +193  ·  下伸底 +262
 *
 *   → xheight = 83/275 = 0.302     baseline = 193/275 = 0.702
 *
 * 这些数字不校准到任何特定的人。真正兜住个体差异的是 pipeline 的 measureInk()。
 */
export const GUIDE = { xheight: 0.302, baseline: 0.702 } as const;

/** 免费档 76 格 = 62 字符 + 14 核心标点（对齐 Calligraphr 免费 75 字符惯例） */
export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export const PUNCT = ['.', ',', '!', '?', "'", '"', '-', '(', ')', ':', ';', '&', '@', '#'];
export const CHARS: string[] = [...LETTERS, ...PUNCT];

/**
 * 参考字在格内的竖直落位。
 * README v3：标点格的浅灰参考字必须印在其真实排版位置，
 * 否则用户会把句号写在格子正中，切出来的字形基线全错。
 */
export type Anchor = 'baseline' | 'xheight-top' | 'middle';
const ANCHOR: Record<string, Anchor> = {
  '.': 'baseline', ',': 'baseline', ':': 'baseline', ';': 'baseline',
  "'": 'xheight-top', '"': 'xheight-top',
  '-': 'middle',
};
export const anchorOf = (ch: string): Anchor => ANCHOR[ch] ?? 'baseline';

/**
 * 连通域面积阈值分级。
 * README v3：小面积字符（. , ' 等）阈值需从 250px² 降到 ~60，
 * 否则句号被当噪点滤除。这里按字符类型分三档。
 */
const TINY = new Set(['.', ',', "'", '"', ':', ';', '-']);
const SMALL = new Set(['!', '(', ')', 'i', 'j', 'l', '1']);
export const minAreaOf = (ch: string): number => (TINY.has(ch) ? 60 : SMALL.has(ch) ? 140 : 250);

/**
 * 单格「墨迹覆盖率」的合格区间，同样必须分级 —— 这一条是 76 格实测打出来的。
 *
 * 起初只把连通域面积阈值分了级（照 README v3 说的做），标点仍然整片丢：
 * 76 格里 `. , ' " -` 五个全灭。根因不在面积过滤，在合格区间——
 * 一个句号在 300×300 的格子里本来就只占约 1% 的像素，而按字母校准的下限是 1.2%，
 * 于是「写得很正确的句号」被判成「墨太淡」扔掉了。
 *
 * 换句话说：小字符不是噪点，是本来就小。判据得知道自己在判什么字符。
 */
export function coverageRangeOf(ch: string): [number, number] {
  if (TINY.has(ch)) return [0.0012, 0.35];
  if (SMALL.has(ch)) return [0.004, 0.5];
  return [0.012, 0.6];
}

export interface Cell {
  char: string;
  /** 格内可书写区左上角与尺寸（模板坐标） */
  x: number; y: number; w: number; h: number;
  /** 基线与 x-height 线的 y（模板坐标）—— 度量对齐的全局比例由这两条线决定 */
  baseline: number; xheight: number;
  /** 格框（含边线），打印用 */
  boxX: number; boxY: number; boxW: number; boxH: number;
}

export interface Layout {
  W: number; H: number; mark: number; pad: number;
  cells: Record<string, Cell>;
}

/** 与 step1_template.py 逐行对应的格子布局 */
export function buildLayout(): Layout {
  const { W, H, MARK, PAD, COLS, ROWS } = TPL;
  const gx0 = PAD;
  const gy0 = PAD + MARK + 50;
  const gw = Math.floor((W - 2 * PAD) / COLS);
  const gh = Math.floor((H - gy0 - PAD - MARK - 40) / ROWS);

  const cells: Record<string, Cell> = {};
  CHARS.forEach((ch, i) => {
    const r = Math.floor(i / COLS);
    const c = i % COLS;
    const x = gx0 + c * gw;
    const y = gy0 + r * gh;
    const boxW = gw - 8;
    const boxH = gh - 8;
    cells[ch] = {
      char: ch,
      x: x + 56, y: y + 50, w: gw - 80, h: gh - 70,
      baseline: y + Math.round(boxH * GUIDE.baseline),
      xheight: y + Math.round(boxH * GUIDE.xheight),
      boxX: x, boxY: y, boxW, boxH,
    };
  });
  return { W, H, mark: MARK, pad: PAD, cells };
}

/** 四角标记在模板坐标里的左上角，顺序 左上/右上/右下/左下 */
export function markerOrigins() {
  const { W, H, MARK, PAD } = TPL;
  return [
    [PAD, PAD],
    [W - PAD - MARK, PAD],
    [W - PAD - MARK, H - PAD - MARK],
    [PAD, H - PAD - MARK],
  ] as [number, number][];
}

/**
 * 格内左上角那个印刷小标签（告诉用户这格该写什么）在格框坐标里占的位置。
 *
 * 这里是唯一真源：`PrintTemplate` 按 LABEL.left/top/size 排版它，
 * `segmentCell` 按 LABEL.clearW/clearH 把这块涂白后再做二值化。
 * 两边各写一份坐标必然漂移 —— 这个文件开头那句话就是为这个写的。
 *
 * 为什么必须涂白：切割窗为了容纳左侧溢出，左边缘取在格框 +36 处，
 * 而标签墨迹横跨 +14 到 +43 —— **两者重叠 7px**。那 7px 竖条会被当成墨迹
 * 切进字形，装成字体后每个字母右上角都挂着一小截别的字符的残片。
 * 这是真实测试抓到的：76/76 全部成功，字体能用，但每个字都带一个小黑点。
 *
 * clearW=52 是安全的：可书写区从 +56 开始，涂白区够不到它。
 */
/**
 * 浅灰参考字的字号。
 *
 * 原来写死 150px，而 Inter 的 x-height 占 em 的 0.553 —— 也就是说参考字的
 * x-height 只有 83px，而模板参考线间距是 110px：**参考字比参考线小 25%**。
 * 模板同时给了两个互相矛盾的参照，谁也对不上，人干脆两个都不看、直接填满格子。
 *
 * 现在由带宽反推：fontSize = 带宽 / 0.553。带宽变了它自动跟着变。
 */
export const INTER_XHEIGHT_RATIO = 0.553;
export const guideFontSize = (bandPx: number) => Math.round(bandPx / INTER_XHEIGHT_RATIO);

export const LABEL = {
  left: 14, top: 8, size: 46,
  clearW: 52, clearH: 58,
  /**
   * 25% 灰。原来是 #3c3c3c（约 76% 黑）—— 那个深度在纸上跟手写笔迹几乎同色，
   * 一眼扫过去分不清哪个是提示、哪个是自己写的，二值化时也铁定被当成墨。
   * 压到 25% 之后，人眼仍然看得清该写哪个字符，但它明显是"印上去的"。
   *
   * 注意：这不能替代涂白。Otsu 是自适应阈值，浅灰在高对比度照片里照样会被
   * 判成墨迹 —— 颜色只是第二层，真正兜底的是 clearW/clearH。
   */
  color: '#bfbfbf',
} as const;

/** 模板像素 -> 毫米（A4 @300dpi） */
export const px2mm = (px: number) => (px / 300) * 25.4;
