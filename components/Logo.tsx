/**
 * 品牌标志 —— 全站唯一真源。
 *
 * 图案：削好的鹅毛笔尖，斜落在一条基线上。
 * 基线不是装饰，它是这个产品的核心机制 —— 模板之所以要印基线与 x-height 线，
 * 正是因为字形的度量对齐全靠这两条线。标志里那一横和纸上那一横是同一条。
 *
 * 注意：`app/icon.svg` 与 `scripts/brand/*.svg` 里有同一份路径的副本。
 * 那两处必须是独立的静态文件（Next 的图标约定要求真实文件，栅格化脚本也要读文件），
 * 没法直接 import 这个组件。改动图形时三处要一起改 —— 已在各文件里互相标注。
 */

/** 纯图案，不含文字。用在导航栏、favicon、OG 卡片里。 */
export function LogoMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="InkToType"
    >
      <rect width="64" height="64" rx="14" fill="#673AB8" />
      {/* 羽片 */}
      <path d="M49 10c8 12 3 25-16 31C29 28 36 15 49 10z" fill="#fff" />
      {/* 削尖的笔尖 */}
      <path d="M30 37l6 4-16 13z" fill="#fff" />
      {/* 羽轴 */}
      <path d="M46 14L31 38" stroke="#673AB8" strokeWidth="2.2" strokeLinecap="round" />
      {/* 基线 */}
      <path d="M13 56h38" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".62" />
    </svg>
  );
}

/**
 * 图案 + 文字的组合。
 *
 * 文字用 leading-none 并配合 flex 的 items-center，是因为 Inter 的默认行高会在
 * 字母上下各留一段空白，直接和方形图标居中对齐会看起来整体偏上。
 */
export function LogoLockup({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={30} className="shrink-0" />
      <span className="text-xl font-extrabold leading-none tracking-tight text-brand">
        Ink<span className="text-ink">ToType</span>
      </span>
    </span>
  );
}
