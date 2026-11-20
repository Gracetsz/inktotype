/** 域名配置 —— 上线正式域名时只改这个文件。 */
export const SITE_URL = 'https://inktotype.com';

/**
 * 临时域名开关 —— 为 true 时全站 noindex, nofollow 且 robots.txt 禁抓。
 * 临时域名上拿到的收录与外链，换域名那天全部作废，还会留下一个和正式站
 * 内容重复的已收录副本反过来抢排名。买好正式域名后：
 *   1. SITE_URL 改成真实域名  2. 下面改 false  3. rebuild + 部署 + GSC 提交 sitemap
 */
export const IS_TEMP_DOMAIN = false;

export const SITE_NAME = 'InkToType';
export const SITE_TAGLINE = 'Turn your handwriting into a real font';
/**
 * 支持邮箱 —— 必须是品牌域名邮箱，不能是 hotmail/gmail 之类通用邮箱。
 *
 * Creem 的审核文档明写："Use a branded support email. If your product is
 * MintAI, your support email should be support@mintai.com, not a generic
 * address."，并且「Business Details 里的邮箱与网站上显示的不一致」是他们
 * 列出的第一大驳回原因。
 *
 * ⚠️ 部署前必须先在 Cloudflare → Email → Email Routing 里把这个地址配好转发，
 * 否则站上挂的是一个收不到信的死地址 —— 审核员真的会往这里发信。
 */
export const CONTACT_EMAIL = 'support@inktotype.com';
export const url = (p = '/') => SITE_URL.replace(/\/$/, '') + p;

/**
 * 分享卡片图。
 *
 * 绝大多数页面靠 Next 的文件约定自动带上它（`app/opengraph-image.png` 一放，
 * 全站 og:image 就有了）。但**页面一旦自己写了 `openGraph: {...}`，
 * 这个对象会整个替换掉约定生成的那份，images 字段跟着消失** —— Next 对
 * openGraph 是浅合并，不是深合并。
 *
 * `/make-your-own-font/` 和 `/font-template/` 正是这样丢掉图的，
 * 而它们恰好是两个 SEO 支柱页、最可能被人分享出去的。
 * 所以凡是自定义了 openGraph 的页面，必须显式带上 `images: [OG_IMAGE]`。
 */
export const OG_IMAGE = '/opengraph-image.png';
