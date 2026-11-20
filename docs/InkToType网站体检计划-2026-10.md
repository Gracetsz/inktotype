# 网站体检计划 · InkToType（2026-10）

**执行方式：本文档交给终端 Claude Code，在 `inktotype/` 项目根目录运行。一次跑完，中途不停顿、不向用户确认。**
**这是只读体检：不改源码、不 deploy、不 commit。** 所有脚本、截图、报告只写进新建的 `health-check/` 目录。
修复留到用户看完报告后另开任务（"按体检报告修复 P0/P1"）。

**产出：`health-check/体检报告-2026-10.md`**（格式见 §7）

---

## 0. 先搞清楚体检对象（必读，否则会查错东西）

**以线上站和以下文档为准：**

| 文档 | 用途 |
|---|---|
| 上线操作单（2026-08-07） | 部署方式、验收基线、自测清单 |
| 追踪接入（2026-08-07） | GA4 + Clarity + Consent Mode 的设计意图 |
| 付费方案（2026-08-07） | 付费系统设计（尚未实施） |
| 二期待办 | 刻意推迟/删除的功能及其加回条件 |
| `审查报告-马斯克5步法.md` | 删除决策的出处 |

用 `ls .. *.md` 找到它们（文件名可能带前缀）。

**`建站计划-字体站.md` 已作废，不得作为验收标准。** 它描述的 FastAPI 后端 / R2 / Stripe $14.9 / 博客 / `/for/` 场景页 / 20 页结构都没有按那个方案落地。真实架构是：

- Next.js 静态导出 → **Cloudflare Workers 静态资源**（不是 Pages），域名 `inktotype.com`
- **全部处理在浏览器里**（JS 管线 `measureInk()` 等），**没有后端、没有上传**——这是产品的核心承诺
- GA4（Consent Mode v2）+ Microsoft Clarity（同意后才加载）
- 付费系统：方案已定（$8 单月 / $5 月订，Workers + D1），**尚未实施**
- 最后一次部署约 2026-08-09（sitemap lastmod），此后两个月无更新

**二期待办 §2 列出的已删除项（`/blog/`、`/for/*`、`/calligraphy-font-generator/`、`/handwriting-font/`、Pro 占位、OTF 导出）不是缺陷，不要报成"功能缺失"。** 只在 §5 检查它们的加回条件是否已满足。

---

## 1. 外部已发现的问题（2026-10-14 线上黑盒检查）——逐条复核

以下是从站外看到的现象。每条必须：**复现 → 定位到源码文件/行 → 判断根因 → 定严重级**。若是误报（例如抓取工具的文本提取假象），明确写"误报"及证据。

| # | 现象 | 怎么复核 |
|---|---|---|
| F1 | **sitemap 只有 9 条，漏了 5 个已上线的页面**：`/font-template-pdf/` `/handwriting-font-generator/` `/handwriting-to-font/` `/how-to-install-a-font/` `/calligraphr-alternative/`。9 条的 lastmod 全部是同一个构建时间 2026-08-09T09:27:50Z | 对比 `out/**/index.html`（去掉 noindex 页）与 `app/sitemap.ts` 输出；查 sitemap 是否手写列表 |
| F2 | **隐私政策自相矛盾**：一处说 *"nothing is loaded until you accept the banner"*，另一处说 GA4 未同意时"stays in a cookieless mode"。按追踪接入 §四的实现，未同意时 gtag.js 已加载并发送无 cookie 请求——前一句是虚假陈述（Creem 审核清单"No false information"会卡这个） | Playwright 打开首页**不点横幅**，记录全部网络请求，列出发往 `googletagmanager.com` / `google-analytics.com` / `clarity.ms` 的请求 |
| F3 | **Google Fonts 每次访问都从 Google 加载**（隐私政策自述请求 `fonts.googleapis.com` / `fonts.gstatic.com`），且不受同意横幅约束。在欧盟有判例风险（德国慕尼黑地方法院 2022 年判决：未经同意动态嵌入 Google Fonts 违反 GDPR） | 同上，查未同意时是否有请求发往这两个域；查 `layout.tsx` 是 `<link>` 引入还是 `next/font`（后者构建时自托管，那隐私政策写错了） |
| F4 | **`/about/` 的 og:url 指向首页**，canonical 却是 `/about/`。疑似根 layout 里写死 `openGraph.url`，子页未覆盖 → 可能**全站**都是这样 | 解析每个页面的 `og:url` 与 `canonical`，列出不一致的页 |
| F5 | **`/test-bench/` 在生产环境公开可访问**（仅 noindex），页面暴露内部测试流程说明、仓库路径 `scripts/fixtures/`、数据采集计划 | 确认是否在 `out/` 中；检查是否随带了测试图片（尤其 `76_real.jpg` 这类**真人笔迹照片**） |
| F6 | **"upload" 措辞与"从不上传"承诺冲突**：步骤名 "Upload photo"、按钮 "Continue to upload →"、FAQ "upload the photo here"。`/draw/` 页脚还写着 "Your photo…never uploaded"（该页根本没有照片），属于复制粘贴的样板文案 | `grep -rn -i "upload" app/ components/`，列出全部用户可见处 |
| F7 | `/font-template/` 疑似显示问题：示例字符串成了 "AABBCC…"、步骤编号重复 "1. 1."、"box— turn" 缺空格 | **截图目测**（可能是抓取工具把参考字+标签字拼在一起的假象） |
| F8 | `/make-your-own-font/` 正文开头疑似渲染出一段 `---`（front matter 泄漏？） | 截图 + 查源文件 |
| F9 | `/calligraphr-alternative/` 的竞品数据：2026-10-14 复核 Calligraphr 定价页仍为 免费 75 字符 / 2 变体 / 1 套并行、需注册；Pro **$10 单月一次性**、**6 个月方案 $6/月**；Pro 600 字符 / 15 变体 / 20 套。数据仍对，但**页面表格与 FAQ 对期限的说法不一致** | 读页面源文件，列出两处原文对比 |
| F10 | **搜索可见度存疑**：我用的搜索工具查 `site:inktotype.com` 一条都没有（它不是 Google，不能下定论） | 需 GSC 数据（§6）。同时确认上线操作单 §六 的 GSC 验证 + sitemap 提交是否做过 |
| F11 | **`www.inktotype.com` 直接返回整站副本，没有 301 到 apex**（canonical 兜住了，但上线操作单 §三 的重定向规则看来没配） | `curl -sI https://www.inktotype.com/` 看状态码 |
| F12 | 旧部署残留未知：`inktotype.pages.dev`（早期 Pages 项目）和 `*.workers.dev` 副本是否还在，从外部判断不了 | `npx wrangler pages project list`；`wrangler.toml` 里 `workers_dev` 是否已改成 `false`；`curl -sI` 对应地址 |

---

## 2. 安全检查（静态站的真实攻击面）

这个站没有服务器端代码，传统"注入/越权"类漏洞面很小。**对这个产品而言，最严重的"漏洞"是笔迹数据意外离开设备**——S1 是重中之重。

### S1 隐私承诺完整性（P0 级检查）
用 Playwright 对三条路线各跑一遍完整流程（用 `scripts/fixtures/` 里的合成图，不用真人照片），全程录网络：
- 断言：任何请求的 URL、body、header 里都**不含图片字节 / base64 / 字形数据 / 字体文件**
- 分"未同意"和"已同意"两种状态，列出所有第三方主机
- 同意后截获 GA4 `collect` 请求，确认 7 个漏斗事件的参数**不含字体名、文件名**（追踪接入 §五）
- 步骤切换后在**实际渲染的 DOM** 里确认 `data-clarity-mask="true"` 仍在（追踪接入 §七：静态 HTML 查不到，要查运行时 DOM）
- **离线承诺**：`/create/` 页面加载完后 `context.setOffline(true)`，再走完整流程。若某些 chunk / wasm 是到第 3 步才懒加载，"可以离线完成"就是假的

### S2 依赖漏洞
- `npm audit`（区分 prod / dev）、`npm outdated`，记录 `next`、`react`、`wrangler` 当前版本
- Next.js 2026-07-20 与 2026-09-30 两次安全发布（补丁版 15.5.27 / 16.3.8）的漏洞几乎都在**服务端运行时**（Server Actions、middleware、图片优化、ISR、`use cache`）。静态导出部署到 Workers 静态资源时线上不受影响——**但要证实这个前提**：`next.config` 里 `output: 'export'`、无 middleware、无 Server Actions、无 `images.remotePatterns`
- 例外：**CVE-2026-94486 影响本地 `next dev`**（开发服务器的 MCP 端点会被恶意网页读取源码片段、项目路径）。这直接影响开发机，升级优先级不能因为"线上不受影响"而降低

### S3 敏感信息泄漏
- 扫描源码、git 历史（如有）、`out/`：Cloudflare token、Creem/Stripe 密钥、`.env`、真实邮箱/人名
- 列出 `out/` 全部文件：有无 source map（`*.map`）、测试图片、`.DS_Store`、fixtures 被打进产物（`.assetsignore` 是否生效）
- 有无早期文档里的 `JaydenHall1962@hotmail.com` 残留（应全站唯一 `support@inktotype.com`）

### S4 线上 HTTP 安全头
对首页、`/create/`、`/draw/`、一个 404 地址分别 `curl -sI`：
- 检查 HSTS、`X-Content-Type-Options`、`Referrer-Policy`、`Permissions-Policy`、`frame-ancestors` / `X-Frame-Options`、CSP
- 确认 `public/_headers` 里写的头**线上真的生效了**（Workers 静态资源应支持，但要实测）
- CSP 若存在：是否靠 `'unsafe-inline'` 放行内联 consent 脚本（可改为 hash）；GA/Clarity/字体域是否精确列出
- 404 页：状态码必须是 404（不是 200 软 404），且显示的是自定义 404 页（上线操作单 §二 `not_found_handling`）

### S5 DNS 与邮件
用 `dig`（不需要 Cloudflare 权限）：
- `support@inktotype.com` 有无 MX；SPF、DMARC（`_dmarc.inktotype.com`）是否存在——没有 DMARC 的话别人可以冒充本站发邮件
- CAA 记录；列出所有能查到的子域 CNAME，检查有无指向已删除服务的悬空记录（子域接管风险）
- 若用户提供了只读 Cloudflare API token（§6），再导出完整 DNS 列表和 SSL/TLS 设置（最低 TLS 版本、Always Use HTTPS）；没有就列进"需用户在后台确认"

---

## 3. 功能检查（三条路线能不能用、真实用户会卡在哪）

### U1 构建与回归（对照上线操作单 §五 基线）
- `npx tsc --noEmit`、`npx next build`：记录生成页数（上次 18 页，现在应更多——差异要能解释）
- 跑仓库里现有的管线回归（`verify76` 等，找不到入口就 grep `package.json` 的 scripts）：模板 baseline / faint / hard / real 各 76/76、标点 14/14；白纸 plain 71/71、plain2 76/76
- 字体度量：基线 ≈0 / x 高 ≈500 / 大写 ≈700，σ ≤ 18。任何一项比基线差都是 P1

### U2 产出字体校验
对每条路线产出的 TTF：
- `fontTools` 能打开；cmap 覆盖全部 76 字符；g / j / p / q / y 的 yMin 为负
- hhea 与 OS/2 typo / win 三组垂直度量一致（管线铁律 5）
- name 表字段完整；`OS/2.fsType` 允许安装（ToS 承诺用户可商用，fsType 不应限制嵌入）
- **OTS 校验**（`pip install opentype-sanitizer` → `ots-sanitize`）：Chrome / Firefox 用它决定是否接受字体，不过就意味着用户把字体放进网页、Canva 等会失败

### U3 浏览器端到端（Playwright：Chromium、WebKit、Firefox + 手机视口）
- `/create/`：打印预览分别导出 A4 与 Letter PDF，确认四角方块都在 → 上传 fixture → 审核 → 重画一格 → **用一张缺角图强制走手动四角兜底** → 构建 → 打字预览 → 下载
- `/font-from-image/`：plain fixture 全流程，含 `~` 占位和删字符
- `/draw/`：用 pointer 事件模拟带压力的笔画，写若干字符 → 构建 → 下载
- 每条路线截图存档；手机视口检查导航、横幅、按钮无错位

### U4 真实照片边界（最可能藏着功能缺陷的地方）
合成 fixture 都是"好照片"。造以下输入逐一测试，记录行为与报错文案：
- **大尺寸手机照片**：24MP（5712×4284）与 48MP。iOS Safari 单个 canvas 面积上限约 1677 万像素，24MP 已超。读代码确认**画到 canvas 之前**就降采样（`createImageBitmap` 的 resize 选项或先画到小 canvas）。Playwright 的 WebKit 不会复现 iOS 内存限制，所以这一条以**代码审查**为准，并列入"需真机验证"
- **HEIC**：桌面 Chrome / Windows 无法解码。看 `<input accept>` 写了什么、选了 HEIC 后用户看到什么
- **EXIF 旋转 90°** 的照片（白纸路线没有 ArUco 兜方向，风险更大）
- 带透明通道的 PNG、极暗/低对比、强阴影、非图片文件、超大文件
- 每种情况：是给出可读的错误提示，还是静默失败 / 卡死

### U5 进度丢失
`/draw/` 要手写 76 个字符，页面没说关掉标签页会不会丢。检查是否存草稿（localStorage / IndexedDB）、是否有 `beforeunload` 提醒。都没有就记一条功能缺陷——误刷新丢掉半小时的手写是最伤人的体验。`/create/` 第 3 步改过的格子同理。

### U6 埋点是否在工作
- 线上 HTML / JS 里 GA4 衡量 ID 与 Clarity 项目 ID 是否已填（追踪接入 §一：留空 = 不注入）
- 同意后跑一遍流程，截获的事件应包含 7 个漏斗事件；`checkout_clicked` 应尚无触发点

### U7 体验与可访问性
- Lighthouse（手机）跑首页、`/create/`、`/draw/`、`/font-template/`：性能 / 可访问性 / 最佳实践 / SEO 四项分数
- 同意横幅能否纯键盘操作，"接受"与"拒绝"是否同等权重
- 主色 #673AB8 上的白字、浅底 #f2eef9 上的文字对比度

---

## 4. SEO 健康

- **sitemap 与路由自动比对**（F1 的根治校验）：`out/` 里所有非 noindex 页必须都在 sitemap
- 每页：title ≤60、description 140–165、canonical 自指、og:url 自指（F4）、og:image 存在、JSON-LD 可解析、只有一个 H1
- 内链：死链 0、孤岛页（除 `/404/`、`/test-bench/`）0、任意页 ≤2 跳到 `/create/`
- **外链存活**：对全部外链发 HEAD/GET（Microsoft 字体安装页、Apple Font Book、OpenType 规范等），列出 4xx/5xx 与重定向
- `www` 与 apex（F11）、`workers.dev` / `pages.dev` 副本（F12）造成的重复内容
- GSC 数据（§6 提供时）：已收录页数、覆盖率错误、Top 查询与展现

---

## 5. 路线图状态核对（"功能是否缺失"按自家计划来算）

只核对状态、写结论，**不实施**：

| 项 | 依据 | 要回答的问题 |
|---|---|---|
| 付费系统 | 付费方案：定型于 08-07，"待 L0 通过后实施"；上线操作单 §五 记录 L0 已于 08-07 通过 | 两个月过去代码里有多少？`checkout_clicked` 有没有触发点？首页 "no paid tier" 文案上线付费时要改哪些地方？列出启动所需的前置清单 |
| 逐字符基线微调工具 | 二期待办 §1 | 加回条件：≥3 起独立反馈，或 GA4 `font_built → font_downloaded` 流失 >30% 且 Clarity 显示第 3 步反复滚动。有数据就判定，没有就写"待数据" |
| `/for/teachers/` | 二期待办 §2 | 加回条件：上线第 4–6 周 GSC 中 teacher / worksheet / classroom / handwriting practice / tracing 类查询合计 ≥50 展现。现在已过第 9 周，有 GSC 数据就判定 |
| 待验证项 | 二期待办 §3 | iPad + Apple Pencil 真机、手机端全流程——仓库里有没有记录做过？没有就列进"需真机验证" |
| 免费档 2 变体 / 152 格模板（L0-b） | 付费方案 §二 | 只记录现状（未开始/进行中），不评价 |

---

## 6. 需要用户提供的输入（可选，缺了不阻塞）

缺哪项就在报告里标"待用户提供"，相关检查跳过，其余照常跑完。

1. GA4 导出：近 60 天 7 个漏斗事件的计数（或漏斗截图）
2. GSC 导出：效果报告（查询 + 页面）与网页索引报告
3. `support@inktotype.com` 收到的用户反馈数量与主题
4. Cloudflare **只读** API token（Zone DNS Read、Zone Settings Read、Workers Scripts Read），放在环境变量 `CF_API_TOKEN`，**不写进任何文件**

---

## 7. 报告格式（`health-check/体检报告-2026-10.md`）

**严重级定义**
- **P0**：笔迹/照片数据离开设备；可被利用的安全漏洞；任一主路线不可用
- **P1**：对外陈述与实际不符（隐私政策、营销文案）；主流设备上流程失败；收录/索引受阻；回归指标比基线差
- **P2**：SEO 次要问题、体验缺陷、可访问性不达标
- **P3**：文案、样式、一致性

**结构**
1. 一页摘要：P0–P3 各几条，一句话总体判断
2. §1 外部发现复核表：F1–F12 逐条"确认 / 误报 / 部分成立" + 证据
3. 全部问题列表，每条：**现象 → 证据（命令与输出摘录、截图路径）→ 根因（文件:行）→ 修复建议 → 预估工作量**
4. 路线图状态（§5）
5. 需用户操作清单（后台设置、真机测试、待提供数据）
6. 附录：执行过的命令、工具版本、跳过的检查及原因

**纪律**
- 每条结论必须有可复现的证据；推测要标"推测"
- 没跑成的检查写"未执行 + 原因"，不得写成"通过"
- 不修复、不部署；报告末尾列"建议修复顺序"即可
