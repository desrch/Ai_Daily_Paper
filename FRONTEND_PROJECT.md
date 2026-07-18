# TodayPaper 前端项目说明

## 1. 项目概述

TodayPaper（今日报纸）是一套以“现代中文报纸”为视觉语言的个性化新闻整理前端。用户可以订阅长期关注方向、生成每日 AI 日报，也可以围绕主题或关键词，把 3～5 篇不同角度的新闻整理为可保存、可下载的纵向海报。

当前前端已完成全部阶段，默认使用本地 Mock 数据即可运行和演示。页面通过统一 API Adapter 访问数据，可在后端接口就绪后切换为真实 HTTP Client，而不需要重写页面组件。

## 2. 技术栈

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Zod 运行时数据校验
- React Hook Form
- Vitest
- `html-to-image` 海报 PNG 导出

## 3. 页面与路由

### 3.1 产品首页

| 路由 | 页面说明 |
|---|---|
| `/` | 品牌首页，介绍每日订阅、主题海报和关键词专题三个核心能力 |

首页承担整个设计系统的视觉样板：报纸式衬线标题、编辑部红色、米白纸张背景、细分隔线、编号栏目与新闻预览。

### 3.2 每日订阅与日报

| 路由 | 页面说明 |
|---|---|
| `/onboarding` | 首次订阅设置，选择关注方向、自定义关键词、邮箱与每日 08:00 投递 |
| `/dashboard` | 用户日报主页，展示今日送达状态、日报预览、订阅方向与历史日报 |
| `/newspaper/[id]` | 完整日报详情，包含头条、栏目、AI 导读、今日速览、关注点和来源区 |
| `/subscriptions` | 管理订阅方向、关键词、启用状态、邮箱和投递设置 |
| `/creations` | 历史作品中心，支持作品类型、关键词和日期筛选 |

完整流程：

1. 从首页进入订阅设置；
2. 选择人工智能、科技数码、商业财经等方向；
3. 保存后进入 Dashboard；
4. 点击“模拟每日 8 点投递”；
5. 查看完整日报；
6. 日报自动进入历史作品。

同一用户同一天的模拟投递具有幂等性，不会重复生成日报。

### 3.3 主题新闻海报

| 路由 | 页面说明 |
|---|---|
| `/theme-poster` | 选择主题、摘要长度、新闻数量和海报模板 |
| `/theme-poster/[id]` | 展示生成后的主题海报，支持保存和下载 PNG |

主题海报会聚合 3～5 篇同主题新闻，展示主题导语、新闻摘要、来源时间、趋势总结和核心关键词。生成过程包含搜索、筛选、摘要、排版四个可视化阶段。

### 3.4 关键词专题海报

| 路由 | 页面说明 |
|---|---|
| `/topic-search` | 搜索关键词、选择 3～5 篇候选新闻并调整顺序 |
| `/topic-poster/[id]` | 展示多角度专题长图，支持保存和下载 PNG |

关键词专题支持：

- 24 小时、7 天、30 天时间范围；
- 至少 6 条候选新闻；
- 相关度分数；
- 政策、技术、产业、应用、市场角度标签；
- 3～5 篇数量约束；
- 取消、替换、上移、下移；
- 按用户选择顺序生成专题；
- 保存到历史作品或导出长图。

### 3.5 固定演示页面

| 路由 | 页面说明 |
|---|---|
| `/demo/home` | 固定演示用户主页 |
| `/demo/newspaper` | 固定演示日报 |
| `/demo/theme-poster` | 固定主题海报 |
| `/demo/topic-poster` | 固定关键词专题海报 |

四个固定演示页面直接读取 `data/demo/*.json` 和本地图片，不调用 API Client、`fetch`、浏览器存储或外部服务，适合离线展示和后端故障时降级演示。

## 4. 组件结构

```text
components/
├── brand/          品牌 Logo 与栏目标题
├── creation/       历史作品卡片与筛选
├── dashboard/      用户主页与日报预览
├── demo/           固定演示标识
├── home/           首页功能区块
├── layout/         Header、导航、容器与 Footer
├── news/           新闻选择、来源、相关度与角度标签
├── newspaper/      日报报头、版面、操作与完整日报
├── poster/         主题/专题海报、结果视图与导出操作
├── states/         Loading、Empty、Error
├── subscription/   订阅表单、管理与投递设置
├── topic/          关键词搜索工作区
├── ui/             Button、Card、Input、Toast、Dialog 等
└── workflow/       生成进度展示
```

页面组件负责组织路由，业务组件管理交互状态，海报与日报展示组件保持为可复用的纯展示结构。

## 5. 数据层与 API Adapter

```text
lib/api/
├── client.ts       根据环境变量选择 Mock 或 HTTP Client
├── contracts.ts    页面依赖的统一 Client 接口
├── mock-client.ts  本地 Promise、延迟、错误注入与 Mock Store
├── http-client.ts  真实 HTTP 请求与响应解析
├── schemas.ts      Zod 请求/响应 Schema
└── errors.ts       标准错误转换
```

普通业务页面只调用 `TodayPaperApiClient`，不会直接读取 Demo JSON。固定 `/demo` 页面是唯一例外。

切换方式：

```env
NEXT_PUBLIC_USE_MOCK_API=true
```

- `true`：使用本地 Mock Client；
- `false`：使用真实 HTTP Client；
- `NEXT_PUBLIC_APP_URL`：服务端执行真实请求时使用的 API 基础地址。

标准前端错误结构：

```ts
interface ApiError {
  code: string;
  message: string;
  retryable: boolean;
}
```

详细接口、请求响应类型、页面调用位置和联调差异见 `docs/API_CONTRACT.md`。

## 6. 本地数据与状态

- `data/demo/news-articles.json`：8 条多角度候选新闻；
- `data/demo/daily-issue.json`：完整日报；
- `data/demo/theme-poster.json`：主题海报；
- `data/demo/topic-poster.json`：关键词专题；
- `data/demo/subscriptions.json`：订阅和投递设置；
- `data/demo/creations.json`：10 条历史作品；
- `data/demo/scenarios.json`：加载、空、错误与部分成功状态。

Mock Client 使用浏览器 `localStorage` 保存普通流程中的订阅、日报和作品状态；固定 `/demo` 页面不会读写这些状态。

## 7. 视觉与响应式

视觉方向为现代中文报纸：

- 米白纸张背景、深色正文与编辑部红色强调；
- 衬线标题与无衬线界面文字组合；
- 报头、栏目编号、细分隔线和纸张阴影；
- 重点呈现来源、时间、报道角度与多新闻结构；
- 不使用通用后台模板式视觉。

目标断点：

- 375px：移动端单栏；
- 768px：平板；
- 1024px：小桌面；
- 1440px：主要桌面展示尺寸。

移动端导航支持 Enter、Escape 和焦点返回；日报多栏、搜索侧栏和海报操作栏会自动转换为移动端布局。

## 8. 安装与运行

```bash
npm install
npm run dev
```

访问：

```text
http://localhost:3000
```

推荐演示入口：

```text
http://localhost:3000/demo/home
```

## 9. 检查与构建

运行完整前端检查：

```bash
npm run check:frontend
```

也可以分别执行：

```bash
npm run lint
npm run typecheck:frontend
npm run test:frontend
npm run validate:data
npm run validate:api
npm run validate:demo
npm run build
```

当前验收结果：

- 前端测试 14/14 通过；
- TypeScript 检查通过；
- Next.js 生产构建通过；
- 14 个要求路由均已检查；
- 20 组响应式检查无横向溢出；
- 四个固定演示页面本地依赖检查通过；
- 未发现已填写的密钥或 Token。

完整验收记录见 `docs/FRONTEND_ACCEPTANCE.md`。

## 10. 后端联调边界

前端暂不实现：

- 真实新闻抓取、去重、排序和角度分类；
- 真实 LLM 摘要与结构化生成；
- 数据库、登录和权限；
- 邮件发送与每日 Cron；
- 部署平台密钥配置。

后端接入前需要共同确认成功/错误响应包裹、参数命名、分页、海报详情与保存接口。确认后应优先修改 `lib/api`，避免让页面直接适配临时后端字段。

