import { GA4_ID, CLARITY_ID, CONSENT_KEY } from '@/lib/analytics';

/**
 * 追踪引导 —— 顺序是这里唯一要紧的事。
 *
 * Consent Mode v2 的规矩：`consent default` 必须在 gtag.js **执行之前**跑完。
 * 晚一步，gtag.js 就已经按"默认允许"写下 cookie 了，之后再发 consent 指令也收不回来。
 *
 * 最初用 next/script 的 afterInteractive 加载 gtag.js，构建产物里它被提到了
 * 内联脚本前面（位置 881 vs 2443）—— 正是上面那个失效场景。
 * 所以改成在同一段内联脚本里、设完 consent 之后自己 appendChild 注入 gtag.js：
 * 单一脚本内的同步语句没有任何重排空间，顺序是语言保证的。
 *
 * 默认四个信号全 denied。广告那三个永远 denied —— 这站不投广告。
 *
 * 注意：boot 字符串里不要写中文注释。这段脚本是内联进 <head> 的，
 * 字符串里的每个字符都会原样出现在全站每一个 HTML 页面里 ——
 * 既白白多出字节，又让一个纯英文站的源码里散落中文。
 * 脚本内的步骤说明只写编号，解释放在这里。
 *   1) 先落默认值，一律 denied
 *   2) 已经同意过的老访客，立刻升级
 *   3) consent 已就位，现在才允许 gtag.js 上场
 *   4) Clarity 没有无 cookie 降级模式，只有明确同意才注入
 */
export default function ConsentBoot() {
  if (!GA4_ID && !CLARITY_ID) return null;

  const boot = `
(function(){
  var KEY='${CONSENT_KEY}';
  var stored=null;
  try{ stored = localStorage.getItem(KEY); }catch(e){}

  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  window.gtag = gtag;

  /* 1 */
  gtag('consent','default',{
    analytics_storage:'denied',
    ad_storage:'denied',
    ad_user_data:'denied',
    ad_personalization:'denied',
    wait_for_update:500
  });

  /* 2 */
  if(stored==='granted'){
    gtag('consent','update',{
      analytics_storage:'granted',
      ad_storage:'denied',
      ad_user_data:'denied',
      ad_personalization:'denied'
    });
  }

  /* 3 */
  ${GA4_ID ? `
  gtag('js', new Date());
  gtag('config','${GA4_ID}',{ anonymize_ip:true });
  var g=document.createElement('script');
  g.async=1; g.src='https://www.googletagmanager.com/gtag/js?id=${GA4_ID}';
  document.head.appendChild(g);` : ''}

  /* 4 */
  ${CLARITY_ID ? `
  if(stored==='granted'){
    (function(w,d,a,r,i){
      w[a]=w[a]||function(){(w[a].q=w[a].q||[]).push(arguments)};
      var t=d.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;
      var y=d.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window,document,'clarity','script','${CLARITY_ID}');
  }` : ''}
})();`.trim();

  return <script id="consent-boot" dangerouslySetInnerHTML={{ __html: boot }} />;
}
