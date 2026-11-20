'use client';
/**
 * 76 格打印模板 —— HTML + @media print，不引 jsPDF/reportlab。
 * 关卡 3 依赖审查：为生成一张 A4 打印页引入 PDF 库，体积几百 KB；
 * 浏览器自带的「打印 → 存为 PDF」效果一样、体积为 0、字体嵌入更可靠。
 *
 * 打印缩放不会破坏识别：单应矩阵从四角标记里解出实际比例，
 * 用户把缩放设成 95% 也照样能切 —— 只要整页在照片里、四角标记完整。
 */
import { useState } from 'react';
import {
  buildLayout, markerOrigins, anchorOf, px2mm, guideFontSize,
  LABEL, RATIO, ASCENDERS, DESCENDERS, TPL, CHARS,
} from '@/lib/template';

const layout = buildLayout();

/**
 * 整张模板按 92% 印，居中留白。
 *
 * 为什么必须缩：四角标记距纸边只有 110px = 9.3mm，而浏览器默认页边距常在 10mm 上下。
 * 用户忘了把边距设成 None，标记就被裁掉一角，管线直接报「找到 0 个」。
 * 缩到 92% 后标记退到距纸边约 17mm，任何默认边距都碰不到。
 *
 * 缩放不影响识别：单应矩阵是从标记本身解出来的，实际印多大都会被还原回
 * 2480×3508 的模板坐标系。这也是为什么打印对话框里的缩放百分比可以随便设。
 */
const PRINT_SCALE = 0.92;
const mm = (px: number) => `${(px2mm(px) * PRINT_SCALE).toFixed(3)}mm`;

export default function PrintTemplate() {
  // 参考字是「位置提示」不是「描红对象」。给一个彻底关掉的开关：
  // 对已经知道字该坐哪的人，空格子写出来的笔迹最放松、最像本人。
  const [ghost, setGhost] = useState(true);
  return (
    <>
      <div className="no-print mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight">Your handwriting template</h1>
        <p className="mt-3 text-gray-600">
          76 boxes: A–Z, a–z, 0–9 and 14 punctuation marks. Print it, write one character per box, then photograph it.
        </p>
        <div className="mt-5 rounded-2xl border-2 border-brand bg-brand-light p-5">
          <p className="font-bold text-ink">Write your own letter — don&apos;t trace the grey one.</p>
          <p className="mt-1.5 text-sm text-gray-700">
            The faint grey character in each box is there to show you <b>where the letter should sit</b>,
            not what it should look like. If you trace it you will end up with a hand-drawn copy of our
            typeface instead of your own handwriting — and &ldquo;this is really how I write&rdquo; is the
            entire point of the font you are about to make. Glance at it, then write the letter the way
            you always write it.
          </p>
        </div>

        <ol className="mt-5 space-y-2 text-sm text-gray-600">
          <li><b className="text-ink">1.</b> Print on A4. Scale and margins are forgiving — the sheet already leaves a wide safety border, and the four black squares tell us the real size.</li>
          <li><b className="text-ink">2.</b> Use a <b>dark pen</b>, medium tip. Ballpoint is fine, pencil is not.</li>
          <li><b className="text-ink">3.</b> Sit each letter <b>on the solid line</b>. Let <i>g, p, q, y, j</i> hang below it — that is what makes them look right.</li>
          <li><b className="text-ink">4.</b> Stay inside the box and <b>do not cover the four black squares</b>.</li>
          {/*
            这一条是第一次真实测试逼出来的。原先"四个黑方块必须完整在画面里"只写在
            上传页上 —— 但用户是先拍完照才走到上传页的，看到时已经晚了。
            提示必须出现在动作发生之前。
          */}
          <li>
            <b className="text-ink">5.</b> When you photograph it, get the{' '}
            <b>whole sheet in frame, including all four black squares</b>. They are how we work out
            the sheet&apos;s real size and angle — crop them off and the photo cannot be read.
          </li>
        </ol>
        <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <b>Already have a sheet from before?</b> Check it has four solid black squares in the corners.
          Older templates did not include them and cannot be processed — print a fresh one from this page.
        </div>
        {/*
          提示放在按钮正上方，因为这是唯一还能补救的时刻 ——
          印完才发现少了标记，就得重写一整张纸。
        */}
        <p className="mt-6 text-sm font-semibold text-ink">
          In the print preview, check that <b>all four black squares are there</b> before you print.
          If they are missing, set <b>Margins</b> to <b>None</b> and tick <b>Background graphics</b>.
        </p>
        <div className="mt-3 flex gap-3">
          <button
            onClick={() => window.print()}
            className="rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
          >
            Print / Save as PDF
          </button>
          <a href="/create/" className="rounded-xl bg-brand-light px-6 py-3 font-semibold text-brand">
            I already wrote mine →
          </a>
        </div>

        <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm text-gray-600">
          <input type="checkbox" checked={ghost} onChange={(e) => setGhost(e.target.checked)}
            className="h-4 w-4 accent-brand" />
          Show the faint guide character in each box
          <span className="text-gray-400">— turn it off if you&apos;d rather write completely freely</span>
        </label>
      </div>

      {/* A4 打印页：所有尺寸用 mm，直接对应 2480×3508 @300dpi 的模板坐标 */}
      <div
        className="print-sheet relative mx-auto mb-16 border border-gray-200 bg-white shadow-lg"
        style={{ width: mm(TPL.W), height: mm(TPL.H) }}
      >
        {/*
          四角定位标记必须用 SVG <rect> 画，不能用 div 的 background。
          ——浏览器默认不打印背景色。屏幕上四个黑方块好好的，一存 PDF 就全没了，
          印出来的纸没有标记，上传后管线找不到定位点。这个 bug 是真实测试抓到的：
          用户拿着一张没有标记的纸走完了整个流程。

          SVG 的 fill 属于「内容」而非「背景」，不受该规则影响，也不依赖用户
          在打印对话框里勾选 Background graphics。globals.css 里另外加了
          print-color-adjust: exact 作为第二层保险。
        */}
        {markerOrigins().map(([x, y], i) => (
          <svg
            key={i}
            width={mm(TPL.MARK)}
            height={mm(TPL.MARK)}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ position: 'absolute', left: mm(x), top: mm(y), display: 'block' }}
          >
            <rect x="0" y="0" width="100" height="100" fill="#000" />
          </svg>
        ))}

        {CHARS.map((ch) => {
          const c = layout.cells[ch];
          const band = c.baseline - c.xheight;
          // 格框局部坐标（模板像素），SVG 直接用它，不再逐个属性转 mm
          const bl = c.baseline - c.boxY;
          const xh = c.xheight - c.boxY;
          const ascY = bl - RATIO.asc * band;
          const capY = bl - RATIO.cap * band;
          const descY = bl + RATIO.desc * band;

          const isUpper = /[A-Z]/.test(ch);
          const showAsc = ASCENDERS.has(ch);
          const showDesc = DESCENDERS.has(ch);

          // 参考字的基线落位：句逗贴基线、引号悬于 x-height 线上、破折号居中
          const a = anchorOf(ch);
          const refBaseline = a === 'xheight-top' ? xh + band * 0.1
            : a === 'middle' ? (bl + xh) / 2 + band * 0.15
              : bl;

          return (
            <svg
              key={ch}
              viewBox={`0 0 ${c.boxW} ${c.boxH}`}
              style={{ position: 'absolute', left: mm(c.boxX), top: mm(c.boxY), width: mm(c.boxW), height: mm(c.boxH), display: 'block' }}
            >
              <rect x="1.5" y="1.5" width={c.boxW - 3} height={c.boxH - 3} rx="10" fill="none" stroke="#cdcdcd" strokeWidth="3" />

              {/* 只画与这个字符有关的辅助线 —— 每格最多三条，条条有用。
                  全部画上会让模板变成一张练习册，且大部分线对当前字符毫无意义。 */}
              {isUpper && <line x1="20" y1={capY} x2={c.boxW - 20} y2={capY} stroke="#e4e4e4" strokeWidth="2" strokeDasharray="10 8" />}
              {showAsc && <line x1="20" y1={ascY} x2={c.boxW - 20} y2={ascY} stroke="#e4e4e4" strokeWidth="2" strokeDasharray="10 8" />}
              <line x1="20" y1={xh} x2={c.boxW - 20} y2={xh} stroke="#dcdcdc" strokeWidth="2" strokeDasharray="10 8" />
              <line x1="20" y1={bl} x2={c.boxW - 20} y2={bl} stroke="#cdcdcd" strokeWidth="3.5" />
              {showDesc && <line x1="20" y1={descY} x2={c.boxW - 20} y2={descY} stroke="#e4e4e4" strokeWidth="2" strokeDasharray="10 8" />}

              {/* 浅灰参考字：字号由带宽反推，x-height 正好压在两条线之间。
                  dominant-baseline 用 alphabetic —— SVG 的文字基线定位是精确的，
                  不像 CSS 那样依赖 line-height 和字体的 ascent/descent 猜位置。 */}
              {ghost && (
                <text
                  x={c.boxW / 2} y={refBaseline}
                  textAnchor="middle" dominantBaseline="alphabetic"
                  fontFamily="Inter, sans-serif" fontSize={guideFontSize(band)} fill="#efefef"
                >{ch}</text>
              )}

              {/* 左上角小标签。坐标与颜色取自 LABEL —— 切割管线要按同一份坐标把它涂白 */}
              <text
                x={LABEL.left} y={LABEL.top + LABEL.size * 0.78}
                fontFamily="Inter, sans-serif" fontSize={LABEL.size} fontWeight={600} fill={LABEL.color}
              >{ch === ' ' ? '␣' : ch}</text>
            </svg>
          );
        })}

        <div
          style={{ position: 'absolute', left: mm(TPL.PAD), bottom: mm(28), fontSize: mm(34), color: '#9a9a9a' }}
        >
          InkToType · 76-character template · write inside the boxes · photograph the whole sheet with all four black squares in frame
        </div>
      </div>
    </>
  );
}
