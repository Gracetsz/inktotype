import type { MetadataRoute } from 'next';
import { url } from '@/lib/site';
export const dynamic = 'force-static';

/**
 * lastModified 必须是写死的真实修改日期，不能用 new Date()。
 * 用 new Date() 的话每次构建全站 9 个页面的 lastmod 都变成"现在" ——
 * Google 会很快学会这个站的 lastmod 没有信息量，然后整体忽略它。
 * 改了某个页面的内容，就手动把那一行的日期改掉。
 */
const PAGES: [path: string, lastmod: string][] = [
  ['/',                    '2026-08-31'],
  ['/create/',             '2026-08-31'],
  ['/make-your-own-font/', '2026-08-31'],
  ['/font-from-image/',    '2026-08-31'],
  ['/font-template/',      '2026-08-31'],
  ['/draw/',               '2026-08-31'],
  ['/handwriting-font-generator/', '2026-08-31'],
  ['/handwriting-to-font/',  '2026-08-31'],
  ['/font-template-pdf/',    '2026-08-31'],
  ['/how-to-install-a-font/','2026-08-31'],
  ['/calligraphr-alternative/', '2026-08-31'],
  ['/about/',              '2026-08-12'],
  ['/privacy-policy/',     '2026-08-08'],
  ['/terms-of-service/',   '2026-08-08'],
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map(([p, lastmod]) => ({
    url: url(p),
    lastModified: new Date(`${lastmod}T00:00:00Z`),
    changeFrequency: 'monthly',
    priority: p === '/' ? 1 : 0.8,
  }));
}
