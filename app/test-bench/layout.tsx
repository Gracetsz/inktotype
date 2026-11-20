import type { Metadata } from 'next';

/**
 * 内部工具页，永不进索引。
 *
 * 它已经不在 sitemap 里、也没有任何内链，但那两条只是"不主动提交"，
 * 挡不住外部链接或浏览器遥测把 URL 喂给爬虫。放开全站收录之后，
 * 这里必须有一条自己的 noindex —— 站点级 robots 已经变成 index: true 了。
 */
export const metadata: Metadata = {
  title: 'Test bench',
  robots: { index: false, follow: false },
};

export default function TestBenchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
