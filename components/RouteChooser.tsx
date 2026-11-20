'use client';
/**
 * 三条路线的入口。默认主推打印模板（B）—— 它的度量来自印刷的基线与 x-height 线，
 * 字形质量最好；另外两条各自解决一类真实约束：没有打印机、有笔的平板。
 */
import Link from 'next/link';

const ROUTES = [
  {
    href: '/create/',
    tag: 'Recommended',
    title: 'Print a font template',
    need: 'Printer + pen + phone camera',
    body: 'Write inside 76 boxes with printed baselines, then photograph the sheet. The baselines are printed, so letter positions are exact.',
    quality: 'Best quality',
  },
  {
    href: '/font-from-image/',
    tag: null,
    title: 'Handwriting to font from a photo',
    need: 'Pen + phone camera',
    body: 'No printer. Write the alphabet on a blank sheet, one group per line. We fit a baseline through your own letters.',
    quality: 'Good quality',
  },
  {
    href: '/draw/',
    tag: null,
    title: 'Draw your own font online',
    need: 'iPad + Apple Pencil, or a drawing tablet',
    body: 'No paper at all. Write each character straight onto the screen. Nothing is photographed, so nothing can be distorted.',
    quality: 'Exact metrics',
  },
];

/**
 * @param exclude 当前所在路线的 href。传了就把那张卡去掉。
 *
 * 为什么需要这个：`/create/` 上这段的标题是「No printer? There are two other ways.」，
 * 却渲染了三张卡，其中「Print a template」链接指回 `/create/` 本身。
 * 它还带着 RECOMMENDED 徽章、用品牌色描边，是整组里最显眼的一张 ——
 * 用户点它，页面纹丝不动。看起来就是"按钮坏了"。
 */
export default function RouteChooser({
  compact = false, exclude,
}: { compact?: boolean; exclude?: string }) {
  const routes = ROUTES.filter((r) => r.href !== exclude);
  return (
    <div className={compact ? '' : 'py-4'}>
      {!compact && (
        <>
          <h2 className="text-3xl font-extrabold tracking-tight">Three ways in</h2>
          <p className="mt-2 text-gray-500">Pick whichever matches what you have on hand. All three are free.</p>
        </>
      )}
      <div className={`mt-6 grid gap-4 ${routes.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
        {/*
          整张卡不能直接包成 <a>。包起来的话锚文本就是卡片里的全部文字
          ——「RECOMMENDEDPrint a font templatePrinter + pen + phone camera…」——
          对 Google 是零信号，还会稀释同页其他锚文本。
          改成 stretched link：<a> 只包标题，再用 after:absolute after:inset-0
          把点击区撑满整张卡。视觉与交互不变，锚文本只剩标题这个关键词。
        */}
        {routes.map((r) => (
          <div
            key={r.href}
            className={`group relative flex flex-col rounded-2xl border-2 p-6 transition ${
              // 高亮跟着"是否被推荐"走，不跟着数组下标走 ——
              // 过滤掉一张之后，下标 0 可能是任意一条路线
              r.tag ? 'border-brand bg-brand-light' : 'border-gray-200 bg-white hover:border-brand-mid'
            }`}
          >
            {r.tag && (
              <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-1 text-[10px] font-bold tracking-wide text-white">
                {r.tag.toUpperCase()}
              </span>
            )}
            <h3 className="text-lg font-bold text-ink">
              <Link href={r.href} className="after:absolute after:inset-0 after:content-['']">
                {r.title}
              </Link>
            </h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{r.need}</p>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600">{r.body}</p>
            <p className={`mt-4 text-sm font-bold ${r.tag ? 'text-brand' : 'text-gray-500'}`}>
              {r.quality} <span className="inline-block transition group-hover:translate-x-1">→</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
