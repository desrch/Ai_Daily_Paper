# TodayPaper 前端数据与 API 契约

> 面向：后端与 AI 开发成员  
> 状态：前端 Adapter 与契约测试已就绪，联调前需共同确认第 6 节差异项  
> 最后核对：2026-07-18

## 1. 契约依据

本文档按当前前端实际代码整理，字段与校验规则以以下文件为准：

- `types/index.ts`：前端共享 TypeScript 类型；
- `lib/api/schemas.ts`：运行时 Zod 校验；
- `lib/api/contracts.ts`：页面依赖的 API Client 方法；
- `lib/api/http-client.ts`：真实 HTTP 接口的当前路径、参数和响应解析方式；
- `data/demo/*.json`：可直接用于联调的完整示例数据。

联调时不应让页面直接适配后端临时字段。若接口字段需要调整，应先修改共享契约和 Adapter。

## 2. 通用格式约定

### 2.1 日期与时间

| 类型 | 格式 | 示例 |
|---|---|---|
| 日期 | `YYYY-MM-DD` | `2026-07-18` |
| 日期时间 | 带时区的 ISO-8601 | `2026-07-18T01:30:00.000Z` |

`publishedAt`、`createdAt`、`updatedAt` 必须是合法 ISO-8601 日期时间。不要返回本地化文本，如 `7 月 18 日`。

### 2.2 URL 与图片

- `sourceUrl`：可选；存在时必须是完整合法 URL。
- `imageUrl`、`coverImageUrl`：可以是站内绝对路径（如 `/images/demo/ai-lab.svg`）或完整合法 URL。
- `href`：必须是站内绝对路径，以 `/` 开头。
- 远程图片域名需要同步加入 Next.js 图片白名单，否则前端无法展示。

### 2.3 数值与枚举

- 新闻相关度 `relevanceScore`：`0～100`。
- 报道角度：`政策 | 技术 | 产业 | 应用 | 市场`。
- 时间范围：`24h | 7d | 30d`。
- 海报模板：`classic | modern`。
- 摘要长度：`brief | standard`。
- 历史作品类型：`daily_issue | theme_poster | topic_poster`。

### 2.4 当前 HTTP 响应形式

当前 `HttpClient` 直接解析响应体，成功响应必须暂时返回裸数据：

```json
{
  "query": "人工智能教育",
  "timeRange": "7d",
  "items": [],
  "total": 0
}
```

当前前端**不能直接解析**下面这种包裹结构：

```json
{
  "data": {},
  "meta": {
    "requestId": "req_xxx",
    "dataMode": "demo",
    "generatedAt": "2026-07-18T01:30:00.000Z"
  }
}
```

如果团队决定采用统一 `{ data, meta }` 响应，应先统一修改 `lib/api/http-client.ts`，不要让部分接口包裹、部分接口返回裸数据。

### 2.5 当前错误响应

非 2xx 响应当前必须返回：

```json
{
  "code": "INVALID_INPUT",
  "message": "请输入有效的搜索关键词",
  "retryable": false
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `code` | string | 是 | 稳定、可检索的错误码 |
| `message` | string | 是 | 可直接展示给用户的简体中文信息 |
| `retryable` | boolean | 是 | 前端是否应提供重试入口 |

当前前端不能直接解析 `{ "error": { ... } }` 包裹。响应中不得包含堆栈、密钥、数据库详情或供应商原始响应。

## 3. 页面与数据依赖

| 页面 | 前端调用 | 主要数据 |
|---|---|---|
| `/onboarding` | `saveSubscriptions` | `SaveSubscriptionsInput`、`SubscriptionBundle` |
| `/dashboard` | `getSubscriptions`、`getDailyIssues`、`simulateDailyDelivery` | 订阅、日报列表、模拟投递结果 |
| `/newspaper/[id]` | `getDailyIssues` | `DailyIssue[]`，前端当前按 `id` 查找 |
| `/subscriptions` | `getSubscriptions`、`saveSubscriptions` | 订阅列表、邮箱与投递设置 |
| `/creations` | `getCreations` | 历史作品筛选与分页结果 |
| `/theme-poster` | `generateThemePoster` | 主题海报生成参数和结果 |
| `/theme-poster/[id]` | `getThemePoster`、`getCreations`、`saveCreation` | 主题海报详情、保存状态 |
| `/topic-search` | `searchNews`、`generateTopicPoster` | 候选新闻、选择顺序、专题结果 |
| `/topic-poster/[id]` | `getTopicPoster`、`getCreations`、`saveCreation` | 专题海报详情、保存状态 |
| `/demo/*` | 无接口 | 直接使用 `data/demo/*.json` |

## 4. 核心数据模型

### 4.1 NewsArticle

```ts
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
```

示例：

```json
{
  "id": "news_01",
  "title": "智能教育质量框架进入公开讨论阶段",
  "description": "研究团队围绕质量、透明度与责任边界提出讨论框架。",
  "source": "示例媒体",
  "sourceUrl": "https://example.com/news/01",
  "publishedAt": "2026-07-18T01:30:00.000Z",
  "category": "人工智能教育",
  "imageUrl": "https://example.com/images/news-01.jpg",
  "keywords": ["人工智能教育", "质量框架"],
  "relevanceScore": 96
}
```

约束：

- `id` 在同一次响应内必须唯一且稳定；
- `description` 必须可直接用于卡片和海报摘要；
- `source`、`publishedAt` 不能为空；
- 不要让 AI 改写来源、原文 URL 和发布时间。

### 4.2 SearchNewsItem

```ts
interface SearchNewsItem extends NewsArticle {
  angle: "政策" | "技术" | "产业" | "应用" | "市场";
}
```

关键词搜索页需要至少 6 条候选新闻；理想情况下覆盖至少 4 个不同报道角度。

### 4.3 DailyIssue

```ts
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
```

关键约束：

- `topics`、`sections` 至少各有 1 项；
- 每个 `section.articles` 至少有 1 篇；
- `leadArticleId` 必须存在于某个 `section.articles[].id` 中；
- 同一用户同一日期应保持幂等，不要生成重复日报。

完整示例：`data/demo/daily-issue.json`。

### 4.4 ThemePosterContent

```ts
interface ThemePosterContent {
  id: string;
  theme: string;
  title: string;
  introduction: string;
  articles: NewsArticle[];
  trendSummary: string;
  keywords: string[];
  template: "classic" | "modern";
  createdAt: string;
}
```

约束：

- `articles` 为 3～5 篇；
- `title` 推荐格式：`{theme} · 主题海报`；
- `articles` 应为同一主题的多篇代表新闻，而不是单篇海报。

完整示例：`data/demo/theme-poster.json`。

### 4.5 TopicPosterContent

```ts
interface TopicPosterContent {
  id: string;
  keyword: string;
  topicTitle: string;
  introduction: string;
  articles: {
    id: string;
    headline: string;
    summary: string;
    angle: "政策" | "技术" | "产业" | "应用" | "市场";
    source: string;
    sourceUrl?: string;
    publishedAt: string;
    imageUrl?: string;
    relevanceScore: number;
  }[];
  trendSummary: string;
  keyTakeaways: string[];
  keywords: string[];
  template: "classic" | "modern";
  createdAt: string;
}
```

约束：

- `articles` 为 3～5 篇；
- 返回顺序必须与请求中的 `articleIds` 完全一致；
- `keyTakeaways`、`keywords` 至少各有 1 项；
- TypeScript 类型与 Zod Schema 均按上述冻结枚举校验；返回其他值会在 Adapter 层被拒绝。

完整示例：`data/demo/topic-poster.json`。

### 4.6 SubscriptionBundle

```ts
interface Subscription {
  id: string;
  userId: string;
  topic: string;
  keywords: string[];
  enabled: boolean;
  todayUpdateCount: number;
  createdAt: string;
  updatedAt: string;
}

interface DeliverySettings {
  email: string;
  dailyDelivery: boolean;
  deliveryTime: "08:00";
}

interface SubscriptionBundle {
  subscriptions: Subscription[];
  deliverySettings: DeliverySettings;
}
```

约束：

- `todayUpdateCount` 为非负整数；
- `email` 可以为空字符串；非空时必须是合法邮箱；
- MVP 的 `deliveryTime` 固定为 `08:00`；
- 关闭每日送达时允许邮箱为空。

完整示例：`data/demo/subscriptions.json`。

### 4.7 Creation

```ts
type CreationType =
  | "daily_issue"
  | "theme_poster"
  | "topic_poster";

interface Creation {
  id: string;
  type: CreationType;
  title: string;
  description: string;
  coverImageUrl: string;
  createdAt: string;
  href: string;
  saved: boolean;
}
```

约束：

- `/creations` 默认只展示 `saved: true` 的作品；
- 海报生成后可先创建 `saved: false` 的记录；
- 用户点击“保存作品”后更新为 `saved: true`；
- `href` 示例：`/theme-poster/theme_01`。

完整示例：`data/demo/creations.json`。

### 4.8 DeliveryResult

```ts
interface DeliveryResult {
  issue: DailyIssue;
  emailSent: boolean;
  status: "completed" | "partial";
  message: string;
}
```

邮件失败但日报生成成功时，`issue` 仍必须是完整的 `DailyIssue`（可直接使用 `data/demo/daily-issue.json` 对照），同时返回：

```json
{
  "emailSent": false,
  "status": "partial",
  "message": "日报已生成，但邮件暂未发送。"
}
```

上面的片段仅展示部分成功状态字段，正式响应不能省略 `issue`。

## 5. 当前前端需要的 HTTP 接口

### 5.1 搜索候选新闻

```http
GET /api/news/search?keyword=人工智能教育&timeRange=7d
```

Query：

| 字段 | 必填 | 约束 |
|---|---|---|
| `keyword` | 是 | 去除首尾空格后 1～50 字符 |
| `timeRange` | 否 | `24h | 7d | 30d`，默认 `7d` |

响应：

```ts
interface SearchNewsResponse {
  query: string;
  timeRange: "24h" | "7d" | "30d";
  items: SearchNewsItem[];
  total: number;
}
```

示例：

```json
{
  "query": "人工智能教育",
  "timeRange": "7d",
  "items": [
    {
      "id": "news_01",
      "title": "智能教育质量框架进入公开讨论阶段",
      "description": "围绕质量、透明度与责任边界提出讨论框架。",
      "source": "示例媒体",
      "publishedAt": "2026-07-18T01:30:00.000Z",
      "category": "人工智能教育",
      "keywords": ["人工智能教育"],
      "relevanceScore": 96,
      "angle": "政策"
    }
  ],
  "total": 1
}
```

### 5.2 生成日报

```http
POST /api/daily-issue/generate
Content-Type: application/json
```

请求：

```json
{
  "userId": "user_01",
  "topics": ["人工智能", "科技数码", "商业财经"],
  "issueDate": "2026-07-18"
}
```

约束：

- `userId` 必填；
- `topics` 至少 1 项；
- `issueDate` 可选，格式为 `YYYY-MM-DD`。

响应：裸 `DailyIssue`。

### 5.3 生成主题海报

```http
POST /api/theme-poster/generate
Content-Type: application/json
```

请求：

```json
{
  "theme": "人工智能",
  "articleCount": 4,
  "summaryLength": "standard",
  "template": "classic"
}
```

响应：裸 `ThemePosterContent`。

### 5.4 生成关键词专题

```http
POST /api/topic-poster/generate
Content-Type: application/json
```

请求：

```json
{
  "keyword": "人工智能教育",
  "articleIds": [
    "news_policy_01",
    "news_tech_01",
    "news_industry_01",
    "news_application_01"
  ],
  "template": "classic"
}
```

约束：

- `keyword`：1～50 字符；
- `articleIds`：3～5 个；
- 响应文章顺序必须与 `articleIds` 一致。

响应：裸 `TopicPosterContent`。

### 5.5 查询主题海报详情

```http
GET /api/theme-posters/:id
```

当前响应约定：

- 找到：裸 `ThemePosterContent`；
- 未找到：HTTP 200，响应体 `null`。

如果后端希望改为 HTTP 404，需要同时调整前端 Not Found 处理。

### 5.6 查询专题海报详情

```http
GET /api/topic-posters/:id
```

当前响应约定：

- 找到：裸 `TopicPosterContent`；
- 未找到：HTTP 200，响应体 `null`。

### 5.7 查询订阅

```http
GET /api/subscriptions
```

响应：裸 `SubscriptionBundle`。

### 5.8 保存全部订阅设置

```http
POST /api/subscriptions
Content-Type: application/json
```

当前前端采用“全量覆盖保存”：

```json
{
  "subscriptions": [
    {
      "id": "sub_ai",
      "topic": "人工智能",
      "keywords": ["大模型", "多模态"],
      "enabled": true
    }
  ],
  "deliverySettings": {
    "email": "reader@example.com",
    "dailyDelivery": true,
    "deliveryTime": "08:00"
  }
}
```

响应：保存后的完整 `SubscriptionBundle`。

当前页面删除单条订阅、暂停订阅和清空订阅，最终都会通过此接口提交完整数组；尚未调用 `PATCH/DELETE /api/subscriptions/:id`。

### 5.9 查询历史日报

```http
GET /api/daily-issues
```

当前响应：裸 `DailyIssue[]`，按 `createdAt` 倒序。

当前日报详情页也使用此接口拉取列表后按 `id` 查找，没有调用单独的 `/api/daily-issues/:id`。

### 5.10 查询历史作品

```http
GET /api/creations
```

Query：

| 字段 | 类型 | 约束 |
|---|---|---|
| `type` | string | `all | daily_issue | theme_poster | topic_poster` |
| `keyword` | string | 标题或描述关键词 |
| `dateFrom` | string | `YYYY-MM-DD` |
| `dateTo` | string | `YYYY-MM-DD` |
| `offset` | integer | 默认 0，非负 |
| `limit` | integer | 默认 12，1～50 |

响应：

```ts
interface CreationListResponse {
  items: Creation[];
  total: number;
  offset: number;
  limit: number;
}
```

示例：

```json
{
  "items": [
    {
      "id": "creation_theme_01",
      "type": "theme_poster",
      "title": "人工智能 · 主题海报",
      "description": "4 篇代表新闻的主题聚合",
      "coverImageUrl": "/images/demo/cover-theme.svg",
      "createdAt": "2026-07-18T02:00:00.000Z",
      "href": "/theme-poster/theme_01",
      "saved": true
    }
  ],
  "total": 1,
  "offset": 0,
  "limit": 12
}
```

### 5.11 保存作品

```http
POST /api/creations/save
Content-Type: application/json
```

请求：

```json
{
  "href": "/theme-poster/theme_01"
}
```

响应：更新后的裸 `Creation`，其中 `saved` 必须为 `true`。

接口应幂等；重复保存同一作品不应产生重复历史记录。

### 5.12 模拟每日投递

```http
POST /api/delivery/simulate
Content-Type: application/json
```

请求：

```json
{
  "userId": "user_01",
  "issueDate": "2026-07-18"
}
```

响应：裸 `DeliveryResult`。

### 5.13 暂不由页面调用的预留接口

前端提示词还列出了以下接口，但当前页面没有对应调用，也没有冻结请求/响应字段：

```http
POST   /api/news/rank
PATCH  /api/subscriptions/:id
DELETE /api/subscriptions/:id
```

为避免在联调前自行假设后端字段，`TodayPaperApiClient` 暂不暴露这三个方法：

- 新闻排序当前是新闻搜索/海报生成流程的服务端内部步骤，页面只消费带 `relevanceScore` 和 `angle` 的搜索结果；
- 单条订阅更新、暂停、删除与清空当前都通过 `POST /api/subscriptions` 全量覆盖；
- 若后端要求页面改用这些接口，需先共同冻结请求、响应和错误结构，再只修改 `lib/api` 与订阅调用层。

## 6. 与后端提示文档的待确认差异

以下差异在联调前必须统一，否则当前页面会解析失败：

| 项目 | 当前前端实现 | 后端提示文档 | 建议 |
|---|---|---|---|
| 成功响应 | 裸数据 | `{ data, meta }` | 二选一后统一修改 Adapter |
| 错误响应 | `{ code, message, retryable }` | `{ error: {...} }` | 二选一后统一修改 Adapter |
| 新闻搜索参数 | `keyword`、`timeRange` | `q`、`range`、`limit` | 建议在 HTTP Adapter 统一映射 |
| 搜索关键词长度 | 最大 50 | 最大 100 | 联调前冻结一个值 |
| 主题海报请求 | 无 `userId` | 需要 `userId` | 登录接入后由服务端 Session 获取更安全 |
| 主题海报响应 | `ThemePosterContent` | 文档误写为 `TopicPosterContent` | 应返回 `ThemePosterContent` |
| 专题文章 ID | `articleIds` | `selectedArticleIds` | 建议在 HTTP Adapter 统一映射 |
| 专题请求 | 无 `userId` | 需要 `userId` | 建议由 Session 获取 |
| 订阅保存 | POST 全量覆盖订阅和投递设置 | POST 创建、PATCH 修改、DELETE 删除 | MVP 可先支持前端全量保存 |
| 日报历史 | 裸 `DailyIssue[]` | 支持分页 | 后端若分页，前端 Adapter 需解包 |
| 作品筛选 | `keyword/dateFrom/dateTo/offset/limit` | `query/date/page` | 建议后端兼容或 Adapter 映射 |
| 海报详情 | 前端需要两个 GET 详情接口 | 后端接口清单未列出 | 需要补充 |
| 保存作品 | `POST /api/creations/save` | 后端接口清单未列出 | 需要补充或重新约定保存语义 |
| 新闻排序 | 页面当前未调用 `/api/news/rank` | 后端要求实现 | 可保留为后端内部或后续能力 |

## 7. 联调验收清单

- [ ] 所有成功响应结构一致，不混用裸数据和 `{ data, meta }`。
- [ ] 所有错误响应结构一致，HTTP 状态码合理。
- [ ] 新闻搜索至少返回 6 条可渲染候选。
- [ ] `relevanceScore` 在 0～100，`angle` 使用冻结枚举。
- [ ] `leadArticleId` 存在于日报栏目文章中。
- [ ] 日报生成和模拟投递对同一用户、同一天幂等。
- [ ] 专题海报文章顺序与请求 ID 顺序一致。
- [ ] 未保存海报不出现在历史作品；保存操作幂等。
- [ ] 时间字段全部为带时区 ISO-8601。
- [ ] 图片 URL 可被浏览器和 Next.js 图片组件访问。
- [ ] API 不返回堆栈、数据库详情、密钥或供应商原始响应。
- [ ] 无真实新闻/AI/数据库服务时仍能返回同结构 Demo 数据。

## 8. 推荐的联调顺序

1. 先确认第 6 节的响应包裹、参数命名和分页差异。
2. 用 `data/demo/*.json` 对照后端响应，通过前端 Zod Schema。
3. 优先联调 `GET /api/news/search` 和两个海报生成接口。
4. 再联调订阅、日报、历史作品和保存接口。
5. 最后关闭 `NEXT_PUBLIC_USE_MOCK_API`，逐页验证真实 HTTP Client。

## 9. 前端契约验证

```bash
npm run test:frontend
npm run validate:api
```

`tests/http-client-contract.test.ts` 覆盖 HTTP Client 的路径、方法、Query、请求体、动态 ID 编码、输入校验和标准错误转换；`scripts/smoke-api-adapter.ts` 覆盖 Mock Client 的核心业务闭环和错误注入。
