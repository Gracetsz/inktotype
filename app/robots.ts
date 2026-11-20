import type { MetadataRoute } from 'next';
import { IS_TEMP_DOMAIN, url } from '@/lib/site';
export const dynamic = 'force-static';
export default function robots(): MetadataRoute.Robots {
  if (IS_TEMP_DOMAIN) return { rules: { userAgent: '*', disallow: '/' } };
  // 注意：/test-bench/ 不在这里 disallow。它靠自己 layout 里的 meta noindex 排除，
  // 而 robots.txt 禁抓会让爬虫根本读不到那条 noindex，反而可能留下一条 URL-only 收录。
  return { rules: { userAgent: '*', allow: '/' }, sitemap: url('/sitemap.xml') };
}
