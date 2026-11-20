/**
 * 分析配置 —— 只改这个文件里的两个 ID 就能接上追踪。
 *
 * 两个 ID 留空时，追踪代码完全不注入（本地开发默认就是这样，
 * 不会把你自己的调试流量混进正式数据）。
 */

/** GA4 衡量 ID，形如 G-XXXXXXXXXX。留空则不加载 GA4。 */
export const GA4_ID = 'G-D25HQDD1XR';

/** Clarity 项目 ID，形如 abcdefghij。留空则不加载 Clarity。 */
export const CLARITY_ID = 'xyhcoxc4bm';

/* ------------------------------------------------------------------ */

export type Consent = 'granted' | 'denied';

/** 版本号放在 key 里：以后若追踪范围变了，改版本号即可重新征求同意。 */
export const CONSENT_KEY = 'itt_consent_v1';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[] };
  }
}

export function readConsent(): Consent | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    // 隐私模式或禁用存储时 localStorage 会抛异常。当作"尚未选择"处理，
    // 也就是保持最保守的状态：Clarity 不加载。
    return null;
  }
}

export function writeConsent(v: Consent) {
  try {
    window.localStorage.setItem(CONSENT_KEY, v);
  } catch {
    /* 存不进去就算了，本次会话内状态仍然生效 */
  }
}

/** 把同意状态推给 Google Consent Mode v2。 */
export function applyConsent(v: Consent) {
  window.gtag?.('consent', 'update', {
    analytics_storage: v,
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
}

/**
 * 按需注入 Clarity。
 *
 * Clarity 没有 Consent Mode 这种"无 cookie 降级模式"——它要么录，要么不录。
 * 所以它只在用户明确同意后才注入，且注入前先检查是否已经注入过。
 */
export function loadClarity() {
  if (!CLARITY_ID || typeof window === 'undefined' || window.clarity) return;
  (function (c: any, l: Document, a: string, r: string, i: string) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    const t = l.createElement(r) as HTMLScriptElement;
    t.async = true;
    t.src = 'https://www.clarity.ms/tag/' + i;
    const y = l.getElementsByTagName(r)[0];
    y.parentNode!.insertBefore(t, y);
  })(window, document, 'clarity', 'script', CLARITY_ID);
}

/**
 * 漏斗埋点。
 *
 * 审查报告 L7 要的是分步漏斗，不是"3 个月后看一个转化率"——
 * 免费档下载完成率低是产品问题，预览多但不付费是定价/文案问题，
 * 只有分步数据能把这两者区分开。
 *
 * 未同意时 GA4 仍会通过 Consent Mode 发送无 cookie 的匿名信号，
 * 所以漏斗的形状拿得到，只是没有跨会话的用户识别。
 */
export function track(name: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  window.gtag?.('event', name, params ?? {});
}

/** 漏斗事件名集中在这里，避免各处拼错字符串导致数据对不上。 */
export const EV = {
  createStarted: 'create_started',
  templateOpened: 'template_opened',
  photoUploaded: 'photo_uploaded',
  photoProcessed: 'photo_processed',
  cornersManual: 'corners_manual',
  glyphEdited: 'glyph_edited',
  fontBuilt: 'font_built',
  fontDownloaded: 'font_downloaded',
  checkoutClicked: 'checkout_clicked',
} as const;
