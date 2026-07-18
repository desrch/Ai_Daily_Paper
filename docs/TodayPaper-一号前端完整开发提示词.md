# TodayPaper 一号前端与视觉开发完整提示词

> 使用方式：将下方“完整主提示词”整体复制给 Codex、Claude Code 或其他具备本地文件操作能力的 Coding Agent。  
> 工作目录：`/Users/shanse/Desktop/vibe coding`  
> 任务角色：一号——前端与视觉开发  
> 目标：使用 Mock 数据先完成可运行、可交互、可演示的完整前端，之后与后端接口联调。

---

## 完整主提示词

```text
你是一名资深前端工程师和 UI 实现专家。请在当前本地仓库中完成“今日报纸 TodayPaper”项目的一号任务：前端与视觉开发。

你需要直接检查仓库、创建或修改代码、运行项目并验证结果，而不是只给出建议或代码片段。完成后必须报告修改文件、启动方式、验证结果和仍需后端提供的接口。

====================
一、项目与工作目录
====================

项目名称：今日报纸 TodayPaper
工作目录：/Users/shanse/Desktop/vibe coding
产品定位：基于 AI 的个性化新闻订阅、新闻聚合与视觉化生成平台。
宣传语：订阅你关心的方向，每天早上 8 点，世界为你排版完成。

开始工作前必须完整阅读：

1. /Users/shanse/Desktop/vibe coding/docs/TodayPaper-产品设计文档.md
2. /Users/shanse/Desktop/vibe coding/docs/TodayPaper-四人分工与GitHub交付流程.md
3. /Users/shanse/Desktop/vibe coding/CONTRIBUTING.md（如果存在）

必须逐张查看并以此作为视觉参考：

1. /Users/shanse/Desktop/vibe coding/docs/previews/TodayPaper-01-首页与订阅.png
2. /Users/shanse/Desktop/vibe coding/docs/previews/TodayPaper-02-日报与作品管理.png
3. /Users/shanse/Desktop/vibe coding/docs/previews/TodayPaper-03-主题海报.png
4. /Users/shanse/Desktop/vibe coding/docs/previews/TodayPaper-04-关键词专题.png

预览图是视觉与页面结构的主要依据，产品设计文档是功能和业务规则的主要依据。两者冲突时：功能行为以产品设计文档为准，视觉风格以预览图为准。

====================
二、执行边界与安全要求
====================

1. 先运行只读命令检查当前文件、Git 状态和已有技术栈，不要假设仓库为空。
2. 当前仓库若没有 package.json，则在当前目录初始化 Next.js 工程；不要在目录内再创建一层重复项目文件夹。
3. 保留已有 docs、docs/previews、.github、.env.example、.gitignore 和 CONTRIBUTING.md，不得删除或覆盖用户已有内容。
4. 不实现真实新闻抓取、真实 LLM 调用、数据库、邮件、Cron 或登录后端。这些属于二号和四号成员。
5. 前端使用类型安全的 Mock 数据和 API Adapter 实现全部交互，确保后续只替换数据访问层即可接入真实接口。
6. 不把 Mock 数据直接散落在页面组件里。
7. 不提交 API Key、Token、真实邮箱或任何密钥；不得创建包含真实密钥的 .env.local。
8. 不执行 git push，不直接修改远程仓库。除非用户明确要求，否则不要自动 commit。
9. 避免大范围无关重构；不要修改后端成员可能负责的 app/api、lib/news、lib/ai、lib/db 和数据库迁移目录。如果为了前端 Mock 必须创建 API 层，请放在 lib/api 或 lib/mock。
10. 不等待后端完成。先用 Mock 数据实现完整页面、流程和状态。

====================
三、技术栈要求
====================

使用：

- Next.js App Router
- TypeScript，开启严格模式
- Tailwind CSS
- shadcn/ui 或与其结构兼容的可复用组件
- lucide-react 图标
- clsx + tailwind-merge，统一 className 工具
- date-fns 或等价轻量日期工具
- zod，用于表单和 Mock/API 数据校验
- React Hook Form，用于订阅设置和管理表单
- 前端长图导出可使用 html-to-image；如果构建环境不稳定，可先实现打印/下载占位并保留明确 TODO

要求：

- 优先使用 Server Components；需要交互、浏览器状态或本地存储时再使用 Client Components。
- 不使用庞大的全局状态库。跨页面演示状态使用 Context + localStorage，或一个轻量 Store。
- 所有图片必须通过 next/image 或清楚说明无法使用的原因。
- 不使用会破坏服务端渲染的随机数据或未处理的 hydration 差异。
- 不依赖远程字体才能正常显示。中文字体使用可靠的系统字体栈，远程字体只作为渐进增强。

如果当前目录没有前端项目，使用与以下目标等价的配置初始化：

- TypeScript
- ESLint
- Tailwind CSS
- App Router
- src 目录可不使用，优先保持 app、components、lib、types 位于仓库根目录
- 路径别名 @/*

====================
四、视觉设计系统
====================

整体视觉必须尽量还原预览图，不要做成通用 AI Dashboard。

设计关键词：

- 现代中文报纸
- 编辑部精选
- 暖白纸张
- 墨黑正文
- 报纸红强调色
- 清晰、可信、克制
- 轻微纸张质感和印刷感

建议设计 Token：

- 页面背景：#F7F3EA 或相近暖白色
- 卡片背景：#FFFDF8
- 主文字：#171717
- 次文字：#666158
- 品牌红：#B91C1C 或相近暗红色
- 品牌红 Hover：#991B1B
- 边框：#D9D2C5
- 弱背景：#F0EBE1
- 成功色：#16803A
- 信息蓝：#2563EB
- 阴影：低饱和、轻量，不使用悬浮玻璃拟态

字体建议：

- 品牌、报头、大标题：Songti SC、STSong、Noto Serif SC、Source Han Serif SC、serif
- UI、正文：PingFang SC、Microsoft YaHei、Noto Sans SC、system-ui、sans-serif
- 英文 TodayPaper：Georgia、Times New Roman、serif

版式规则：

1. 全局最大内容宽度建议 1280～1440px。
2. 顶部导航白色或暖白色、细底边，Logo 位于左侧，核心导航居中，账户入口在右侧。
3. 页面标题使用中文衬线字体，字号大、行距紧凑，标题下可使用短红线或小红色装饰。
4. 卡片使用 1px 暖灰边框、6～12px 圆角、极轻阴影。
5. 日报和海报本体尽量减少圆角，使用纸张边框和自然投影，呈现印刷物感。
6. 主要按钮为暗红底白字；次要按钮为白底深色边框；危险操作使用红色描边。
7. 避免大面积渐变、霓虹、高饱和紫色、玻璃拟态和典型加密货币 Dashboard 风格。
8. 页面要有充足留白，但不能稀疏到缺少信息密度。
9. 图片比例稳定，加载失败时使用本地报纸风格占位图。
10. 动画克制：150～250ms 的淡入、颜色和位移过渡即可；支持 prefers-reduced-motion。

请将颜色、字体、阴影、圆角和页面宽度抽象为 CSS Variables 或 Tailwind Theme，不要在页面中重复硬编码。

====================
五、路由与页面清单
====================

实现以下路由。若现有项目已有等价路由，优先兼容，不要重复创建。

1. /                         产品首页
2. /onboarding               首次订阅设置页
3. /dashboard                用户主页 / 日报收件箱
4. /newspaper/[id]           日报详情页
5. /subscriptions            订阅管理页
6. /creations                历史作品页
7. /theme-poster             主题海报生成页
8. /theme-poster/[id]        主题海报结果页
9. /topic-search             关键词搜索与候选新闻页
10. /topic-poster/[id]       关键词专题海报结果页
11. /demo/home               固定演示用户主页
12. /demo/newspaper          固定演示日报
13. /demo/theme-poster       固定演示主题海报
14. /demo/topic-poster       固定演示关键词专题海报

所有页面必须共享统一 Header 和视觉系统。当前导航建议：

- 首页
- 每日日报
- 主题海报
- 专题搜索
- 历史作品

根据 pathname 显示当前激活项。

====================
六、各页面详细要求
====================

【1. 产品首页 /】

必须包含：

- Logo：“今日报纸 TodayPaper”；
- Hero 标题和宣传语；
- 淡化的报纸纹理或卷起报纸视觉，不得遮挡文字；
- 三个核心功能卡片：
  1. 每日订阅日报
  2. 主题新闻海报
  3. 关键词专题海报
- 每个卡片有预览缩略图、说明和可点击入口；
- 主要 CTA：“设置我的日报”，跳转 /onboarding；
- 产品价值条：AI 智能筛选、专业排版、个性化订阅、准时送达；
- 简洁 Footer。

交互：

- 三个功能卡片可点击并有 Hover/Focus 状态；
- CTA 正常路由；
- 键盘可访问；
- 首页在 375px 宽度下变为单栏。

【2. 首次订阅设置页 /onboarding】

必须包含：

- 三步进度条：选择关注方向、设置投递方式、确认并开始；
- 标题：“设置你的每日订阅”；
- 主题多选：人工智能、科技数码、商业财经、体育赛事、校园生活；
- “添加更多”或额外主题；
- 自定义关键词输入，最多 50 字；
- 接收邮箱输入；
- 每日送达开关；
- 固定时间 08:00；
- “保存订阅”按钮；
- 隐私提示。

校验：

- 至少选择一个方向或输入一个自定义关键词；
- 开启邮件投递时邮箱必填且格式正确；
- 自定义关键词去重并 trim；
- 错误信息显示在对应控件附近；
- 保存后写入前端演示状态并跳转 /dashboard。

【3. 用户主页 /dashboard】

必须包含：

- 标题：“早上好，今日报纸已送达”；
- 已送达状态卡：今天 08:00、演示邮箱；
- 今日报纸大卡片；
- 今日头条预览和主图；
- 右侧“AI 为你简报”；
- 我的订阅主题标签；
- 下一次投递：明日 08:00；
- 三个操作：查看完整日报、模拟每日 8 点投递、管理订阅；
- 历史日报横向卡片或网格。

模拟投递交互：

- 点击后显示四阶段进度：获取新闻、筛选去重、生成摘要、完成排版；
- 按钮在处理中禁用，防止重复触发；
- 约 2～4 秒完成 Mock 流程；
- 成功后显示 Toast 并刷新今日报纸状态；
- 同一天再次点击直接提示“今日份日报已生成”；
- 支持模拟错误状态和重试入口，至少在代码中保留可配置开关。

【4. 日报详情 /newspaper/[id]】

尽量还原经典中文报纸排版，必须包含：

- 返回主页、分享、下载/打印操作；
- 报头“今日报纸 TodayPaper”；
- 日期、星期、期号和生成时间；
- 今日头条标签；
- 大标题、摘要、主图、来源和时间；
- AI 今日导读；
- 三栏新闻：AI 前沿、科技观察、商业脉搏；
- 今日速览；
- 值得继续关注；
- 来源区或每篇新闻的原文入口。

桌面端采用报纸多栏版式；移动端转换为单栏，不能简单缩小整张报纸。

打印样式：

- 添加 @media print；
- 打印时隐藏导航和操作按钮；
- 保留报头、正文和来源；
- 避免内容在卡片中被不合理截断。

【5. 订阅管理 /subscriptions】

必须包含：

- 标题“管理订阅”；
- 当前主题卡片：人工智能、科技数码、商业财经；
- 每张卡显示启用开关、今日更新数量、相关关键词和删除按钮；
- 添加订阅入口；
- 自定义关键词；
- 接收邮箱与修改按钮；
- 每日送达开关；
- 投递时间 08:00；
- 保存修改；
- 清空所有订阅作为危险操作。

交互：

- 暂停订阅不删除数据；
- 删除单个订阅需要确认 Dialog；
- 清空全部需要二次确认；
- 修改后持久化到 localStorage Mock Store；
- 显示成功 Toast。

【6. 历史作品 /creations】

必须包含：

- 标题“历史作品”；
- 标签页：全部、每日日报、主题海报、专题海报；
- 类型筛选；
- 日期筛选；
- 作品名称或关键词搜索；
- 作品网格；
- 每张卡包含封面、标题、类型、生成时间和“查看作品”；
- 分页或加载更多；
- 无结果状态与清空筛选按钮。

使用混合 Mock 内容：个人日报、人工智能主题、人工智能教育专题、商业财经周报、全球新能源观察。

【7. 主题海报生成 /theme-poster】

必须包含：

- 顶部四阶段步骤：搜索相关新闻、筛选代表内容、生成专题摘要、完成海报排版；
- 标题：“生成主题新闻海报”；
- 主题卡片：AI 前沿、科技数码、商业财经、体育赛事、电影娱乐、校园生活、健康生活、自定义主题；
- 摘要长度：精简 / 标准；
- 新闻数量：3 / 4 / 5，默认 4；
- 海报风格：经典报刊 / 现代简约，默认经典报刊；
- 主按钮：“生成主题海报”。

生成交互：

- 未选择主题时按钮不可用；
- 点击后依次更新四阶段进度；
- 生成成功后创建 Mock 作品并跳转 /theme-poster/demo-theme；
- 失败时显示错误卡和“使用演示数据继续”按钮。

【8. 主题海报结果 /theme-poster/[id]】

必须包含：

- 完成的四阶段进度；
- 标题“人工智能 · 主题海报”；
- 中央纵向纸张海报；
- 海报内容：主题总标题、专题导语、4 篇新闻、每篇标题/摘要/来源/时间/配图、AI 趋势总结、核心关键词、二维码或项目标识；
- 右侧所选新闻列表；
- 完成状态；
- 操作：重新生成、保存作品、下载长图。

注意：这是多篇同主题新闻汇总，不是单篇新闻海报。

【9. 关键词搜索 /topic-search】

必须包含：

- 标题：“搜索关键词，生成专题海报”；
- 搜索词默认“人工智能教育”；
- 时间范围：过去 24 小时 / 7 天 / 30 天；
- 搜索按钮；
- 至少 6 条候选新闻；
- 每条显示复选框、标题、摘要、来源、发布时间、相关度分数和报道角度；
- 角度标签：政策、技术、产业、应用、市场；
- 右侧“已选新闻 4/5”；
- 已选新闻可以移除、上移、下移或拖拽排序；
- “生成专题海报”按钮；
- 提示“请选择 3～5 篇不同角度的新闻”。

规则：

- 默认选中 4 篇不同角度的新闻；
- 少于 3 篇或超过 5 篇禁止生成；
- 搜索词为空禁止搜索；
- 选择数量和按钮状态实时更新；
- 生成后跳转 /topic-poster/demo-topic。

【10. 关键词专题结果 /topic-poster/[id]】

必须包含：

- 标题“人工智能教育 · 专题海报”；
- 大型纵向专题长海报；
- 专题导语；
- 4 篇编号新闻；
- 每篇的角度标签、摘要、来源、时间和配图；
- 趋势总结；
- 关键结论；
- 核心关键词；
- 完整来源区；
- 右侧完成状态与操作按钮：调整新闻、重新生成、保存作品、下载长图。

【11～14. 固定演示路由】

固定演示路由必须：

- 直接读取 data/demo 下的本地 JSON；
- 不依赖登录、数据库、新闻 API 或 AI API；
- 不受 localStorage 中用户操作影响；
- 显示小型“演示模式”标识；
- 保持与真实页面完全相同的视觉组件；
- 即使后端不可用，也能独立打开和演示。

====================
七、核心组件结构
====================

建议创建以下结构，可结合现有仓库调整，但不要把所有页面写成巨型组件：

components/
├── layout/
│   ├── site-header.tsx
│   ├── mobile-nav.tsx
│   ├── page-container.tsx
│   └── site-footer.tsx
├── brand/
│   ├── logo.tsx
│   └── section-heading.tsx
├── news/
│   ├── news-card.tsx
│   ├── source-meta.tsx
│   ├── relevance-badge.tsx
│   ├── angle-badge.tsx
│   └── news-selector.tsx
├── newspaper/
│   ├── newspaper-masthead.tsx
│   ├── lead-article.tsx
│   ├── daily-briefing.tsx
│   ├── newspaper-section.tsx
│   ├── quick-news.tsx
│   └── watch-next.tsx
├── poster/
│   ├── theme-poster.tsx
│   ├── topic-poster.tsx
│   ├── poster-article.tsx
│   └── export-actions.tsx
├── subscription/
│   ├── topic-selector.tsx
│   ├── subscription-card.tsx
│   └── delivery-settings.tsx
├── creation/
│   ├── creation-card.tsx
│   └── creation-filters.tsx
├── workflow/
│   └── generation-steps.tsx
└── states/
    ├── loading-state.tsx
    ├── empty-state.tsx
    ├── error-state.tsx
    └── success-state.tsx

可复用原则：

- 真实页面和 /demo 页面必须复用同一展示组件；只替换数据来源。
- 主题海报与关键词专题共享 PosterArticle、SourceMeta 和 ExportActions。
- 所有新闻来源信息统一通过 SourceMeta 渲染。
- 所有进度流程统一通过 GenerationSteps 渲染。
- 不要复制整页 JSX 来创建 demo 页面。

====================
八、数据类型与 Mock 数据
====================

在 types 中定义并导出以下类型。字段必须与后端成员约定保持一致：

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content?: string;
  source: string;
  sourceUrl?: string;
  publishedAt: string;
  category: string;
  imageUrl?: string;
  keywords: string[];
  relevanceScore?: number;
}

interface DailyIssue {
  id: string;
  userId: string;
  issueDate: string;
  newspaperName: string;
  topics: string[];
  leadArticleId: string;
  dailyBriefing: string;
  sections: {
    title: string;
    articles: NewsArticle[];
  }[];
  quickNews: string[];
  watchNext: string[];
  createdAt: string;
}

interface TopicPosterContent {
  id: string;
  keyword: string;
  topicTitle: string;
  introduction: string;
  articles: {
    id: string;
    headline: string;
    summary: string;
    angle: string;
    source: string;
    sourceUrl?: string;
    publishedAt: string;
    imageUrl?: string;
    relevanceScore: number;
  }[];
  trendSummary: string;
  keyTakeaways: string[];
  keywords: string[];
  template: string;
  createdAt: string;
}

可以额外定义：

- Subscription
- DeliverySettings
- Creation
- GenerationStatus
- ApiError

Mock 数据至少覆盖：

1. 每日订阅：AI、科技、商业；
2. 主题海报：人工智能；
3. 关键词专题：人工智能教育；
4. 历史作品 8～12 条；
5. 加载、空、错误和部分成功状态。

Mock 新闻必须：

- 使用明显的演示内容，不冒充实时新闻；
- 包含完整来源、时间、关键词和图片；
- 关键词专题包含政策、技术、产业、应用、市场等不同角度；
- 图片优先使用项目本地资源或稳定的占位方案；
- 不依赖带有授权风险或经常失效的远程图片 URL。

====================
九、前端 API Adapter
====================

创建独立的数据访问层，例如：

lib/api/
├── client.ts
├── contracts.ts
└── mock-client.ts

页面组件不得直接 import data/demo 中的 JSON，固定 /demo 页面除外；普通页面统一调用 API Adapter。

建议暴露：

- searchNews(params)
- generateDailyIssue(input)
- generateThemePoster(input)
- generateTopicPoster(input)
- getSubscriptions()
- saveSubscriptions(input)
- getDailyIssues()
- getCreations(filters)
- simulateDailyDelivery()

Mock Client 应：

- 返回 Promise；
- 模拟 300～800ms 请求延迟；
- 可通过开发开关模拟错误；
- 返回值使用 zod 校验；
- 保持与将来的真实接口一致。

建议统一错误：

interface ApiError {
  code: string;
  message: string;
  retryable: boolean;
}

不要在每个页面中自行 setTimeout 模拟接口；延迟和错误模拟集中在 Mock Client。

====================
十、状态、可访问性和响应式
====================

每个核心流程必须覆盖：

- 初始状态；
- Loading；
- Empty；
- Success；
- Error；
- Disabled；
- 部分成功，如日报保存成功但邮件发送失败。

可访问性：

- 语义化 header、nav、main、section、article、footer；
- 所有按钮可以键盘访问；
- Focus Ring 清晰；
- 图标按钮必须有 aria-label；
- 表单控件关联 label；
- 错误信息使用 aria-describedby 或等价方式；
- 文本与背景满足合理对比度；
- 不以颜色作为唯一状态表达；
- Dialog 打开后正确管理焦点。

响应式断点目标：

- 375px：单栏移动端；
- 768px：平板；
- 1024px：小桌面；
- 1440px：预览图主要目标尺寸。

特殊规则：

- 桌面日报多栏在移动端改为单栏；
- 搜索页右侧“已选新闻”在移动端变为底部抽屉或页面下方区域；
- 海报结果页右侧操作栏在移动端移到海报下方；
- 顶部导航在移动端使用可访问的菜单；
- 不允许横向溢出遮挡核心操作。

====================
十一、海报下载与保存
====================

前端至少实现：

1. 保存作品：写入 Mock Store/localStorage，并在历史作品页出现；
2. 下载长图：尝试将指定海报 DOM 节点导出为 PNG；
3. 导出期间显示 Loading，避免重复点击；
4. 导出失败显示可理解错误并提供打印替代；
5. 导出时隐藏操作按钮，只包含海报本体；
6. 文件名包含类型、主题和日期，例如：
   TodayPaper-人工智能-主题海报-2026-07-18.png

如果 html-to-image 与某些图片跨域冲突，必须改用本地图片或可控占位图，不要留下无法下载的演示流程。

====================
十二、工程质量要求
====================

1. TypeScript 禁止使用无理由的 any。
2. 页面组件不超过合理复杂度，复杂区块拆成组件。
3. 数据、业务状态和纯展示组件分离。
4. 避免重复样式；抽取设计 Token 和通用类。
5. 不在 render 中执行不可控副作用。
6. 清理定时器，避免页面卸载后更新状态。
7. 对动态路由 id 不存在时显示友好 Not Found，而不是崩溃。
8. 添加 app/error.tsx、app/not-found.tsx 和必要的 loading.tsx。
9. 不留下明显 TypeScript、ESLint 或构建错误。
10. 若新增依赖，保持数量克制，并在最终报告中说明用途。
11. 页面文案统一使用简体中文。
12. 不能使用 Lorem ipsum、随机英文占位或无意义数据。

建议增加最小测试：

- 主题选择逻辑；
- 关键词专题 3～5 篇数量约束；
- 已选新闻排序；
- 同一天模拟日报防重复；
- 订阅表单校验。

如果时间不允许完整测试框架，至少保证 lint、typecheck、build 和关键页面手动冒烟通过。

====================
十三、推荐实施顺序
====================

请按以下顺序执行，完成一阶段后立即运行检查，不要最后一次性调试。

阶段 0：检查与计划

- 检查 Git 状态和已有文件；
- 阅读两份文档和四张预览图；
- 确认是否已有 Next.js 工程；
- 列出将要修改的文件和风险；
- 不要停下来等待确认，除非发现会覆盖用户代码的高风险冲突。

阶段 1：工程与设计系统

- 初始化 Next.js；
- 配置 Tailwind、TypeScript、ESLint；
- 创建全局 CSS Variables；
- 创建 Header、Logo、PageContainer、Button/Card/Input 等基础组件；
- 完成首页作为设计系统样板。

阶段 2：类型、Mock 与 Adapter

- 创建核心类型；
- 创建演示 JSON；
- 创建 Mock Store；
- 创建 API Adapter；
- 验证数据符合类型和 zod Schema。

阶段 3：每日订阅模块

- /onboarding；
- /dashboard；
- /newspaper/[id]；
- /subscriptions；
- /creations。

阶段 4：主题海报模块

- /theme-poster；
- /theme-poster/[id]；
- 生成进度；
- 保存与下载。

阶段 5：关键词专题模块

- /topic-search；
- 候选新闻选择、数量约束和排序；
- /topic-poster/[id]；
- 保存与下载。

阶段 6：固定演示与降级

- 四个 /demo 路由；
- 错误状态；
- Not Found；
- 无外部服务冒烟测试。

阶段 7：响应式与质量检查

- 检查 375、768、1024、1440px；
- 检查键盘操作和 Focus；
- 运行 lint、typecheck、build；
- 修复所有阻断问题；
- 启动本地服务并逐页检查。

====================
十四、必须执行的验证
====================

使用项目实际 package manager 执行等价命令：

- 安装依赖；
- npm run lint；
- npm run typecheck；
- npm run build；
- npm run dev。

如果 package.json 没有 typecheck 脚本，请添加：

"typecheck": "tsc --noEmit"

至少手动验证以下路由返回成功并可操作：

- /
- /onboarding
- /dashboard
- /newspaper/demo-daily
- /subscriptions
- /creations
- /theme-poster
- /theme-poster/demo-theme
- /topic-search
- /topic-poster/demo-topic
- /demo/home
- /demo/newspaper
- /demo/theme-poster
- /demo/topic-poster

必须验证以下完整流程：

流程 A：
首页 → 设置我的日报 → 选择 AI/科技/商业 → 保存 → Dashboard → 模拟每日 8 点 → 查看日报。

流程 B：
主题海报 → 选择人工智能 → 生成 → 查看主题海报 → 保存 → 历史作品。

流程 C：
关键词搜索人工智能教育 → 选择 4 篇不同角度新闻 → 调整顺序 → 生成专题 → 下载或保存。

流程 D：
在不调用任何外部接口的情况下，四个 /demo 页面全部可打开。

====================
十五、前后端联调预留
====================

前端完成后，必须在文档或最终报告中列出需要后端实现的接口契约：

GET  /api/news/search
POST /api/news/rank
POST /api/daily-issue/generate
POST /api/theme-poster/generate
POST /api/topic-poster/generate
GET  /api/subscriptions
POST /api/subscriptions
PATCH /api/subscriptions/:id
DELETE /api/subscriptions/:id
POST /api/delivery/simulate
GET  /api/daily-issues
GET  /api/creations

把 Mock Client 和真实 Client 设计成可替换实现。推荐由环境变量控制：

NEXT_PUBLIC_USE_MOCK_API=true

注意：不要在浏览器端暴露任何服务端 Secret。该变量只表示是否使用 Mock，不包含密钥。

====================
十六、完成定义 Definition of Done
====================

只有全部满足以下条件才算完成：

- 四张预览图对应的 10 个主要页面均已实现；
- 四个固定演示路由已实现；
- 三条核心用户流程可以从头走通；
- 风格明显属于 TodayPaper，而不是通用模板；
- 主题海报和关键词专题均是 3～5 篇多新闻汇总；
- 来源、时间和原文入口清晰；
- 页面使用 Mock API Adapter，不与后端强耦合；
- 加载、空、成功、错误状态完整；
- 移动端不存在核心功能阻断；
- lint、typecheck、build 通过；
- 不包含密钥和真实用户信息；
- 没有破坏 docs、preview 图片或其他成员文件；
- 最终报告清楚列出后端待联调项。

====================
十七、最终回复格式
====================

完成后用简洁中文报告：

1. 实现结果概述；
2. 页面与路由清单；
3. 主要组件与数据层；
4. 视觉还原要点；
5. 运行和验证结果；
6. 未完成或降级内容；
7. 等待后端提供的接口；
8. 重要文件的绝对路径。

不要只说“已完成”。必须提供可验证的文件、命令结果和剩余风险。
```

---

## 推荐使用方式

### 方式一：一次性执行

将上面的完整主提示词一次性交给 Coding Agent，适合具备长任务执行和自动验证能力的工具。

### 方式二：分阶段执行

如果模型容易中途遗漏页面，可以在完整主提示词之后依次追加：

```text
现在只执行阶段 0～2：检查仓库、初始化工程、完成设计系统、类型、Mock 数据和 API Adapter。完成并验证后停止，不要提前实现业务页面。
```

```text
继续执行阶段 3：完成首页、首次订阅、用户主页、日报详情、订阅管理和历史作品，并逐页验证。
```

```text
继续执行阶段 4～5：完成主题海报与关键词专题的生成、选择、排序、预览、保存和下载流程。
```

```text
继续执行阶段 6～7：完成固定演示页面、降级状态、响应式、可访问性和全部质量检查，并给出最终报告。
```

### 方式三：前后端即将联调时追加

```text
现在后端即将开始联调。请不要修改页面视觉和业务组件，只检查 lib/api 的抽象是否能在 Mock Client 与真实 HTTP Client 之间切换；输出每个接口的请求类型、响应类型、页面调用位置和错误处理方式。不要自行假设后端未约定的字段。
```

---

## 一号提交前自检

- [ ] 首页与四张预览图视觉方向一致；
- [ ] 10 个主要页面全部完成；
- [ ] 4 个固定演示页面可离线打开；
- [ ] 前端使用 Mock API Adapter；
- [ ] 三个核心流程完整；
- [ ] 日报和海报显示来源；
- [ ] 关键词专题支持 3～5 篇、多角度、取消和排序；
- [ ] 模拟每日 8 点有进度和防重复；
- [ ] 海报可以保存并尝试下载长图；
- [ ] 375px 与 1440px 均可用；
- [ ] Loading、Empty、Error、Success 状态完整；
- [ ] `lint`、`typecheck`、`build` 通过；
- [ ] 没有提交 `.env.local` 或密钥；
- [ ] 没有修改后端成员负责的业务逻辑；
- [ ] PR 包含页面截图与测试结果。

