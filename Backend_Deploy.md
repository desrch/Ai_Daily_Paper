# TodayPaper 后端本地环境配置与搭建指南

> 适用对象：需要在本地运行 TodayPaper 后端并与前端联调的成员  
> 部署目标：本地启动后端 API，连接已准备好的 Supabase 数据库和 DeepSeek API  
> 当前后端目录：`/Users/desrchfriedrich/Code/Ai_Daily_Paper`  
> 默认后端端口：`3001`

## 1. 本地运行目标

其他成员本地部署测试时，只需要完成以下目标：

- 后端 Next.js API 能在本地启动；
- 后端能读取共享的 `.env.local`；
- 后端能连接 Supabase；
- 后端能调用 DeepSeek 生成结构化内容；
- 前端能通过 `/api/*` 或后端地址访问 API；
- 即使 Supabase 或 DeepSeek 暂时不可用，也能通过 fallback 返回可渲染数据。

## 2. 前置要求

本地需要安装：

```bash
node -v
npm -v
```

建议：

- Node.js 版本：`20+` 或 `22+`
- npm 版本：`10+`

如果 `npm install` 出现 npm 自身错误，可以改用 `pnpm install`，但后端当前已有 `package-lock.json`，优先使用 `npm install`。

## 3. 获取后端代码

进入后端目录：

```bash
cd /Users/desrchfriedrich/Code/Ai_Daily_Paper
```

如果是从 GitHub 拉取：

```bash
git clone <repo-url>
cd Ai_Daily_Paper
```

部署前建议查看当前状态：

```bash
git status
```

## 4. 安装依赖

首次运行：

```bash
npm install
```

后端主要依赖：

```text
next
react
react-dom
typescript
@supabase/supabase-js
openai
zod
```

说明：

- `@supabase/supabase-js` 用于连接 Supabase；
- `openai` SDK 用于以 OpenAI-compatible 方式调用 DeepSeek；
- `zod` 用于校验 AI 返回 JSON。

## 5. 配置 `.env.local`

后端已经准备好 DeepSeek 和 Supabase，可以直接共享 `.env.local` 文件给本地测试成员。

请将共享的 `.env.local` 放到后端项目根目录：

```text
Ai_Daily_Paper/
├── .env.local
├── package.json
├── app/
├── lib/
└── types/
```

`.env.local` 应包含：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_ENABLED=true

DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
AI_ENABLED=true

NEWS_PROVIDER_MODE=local
```

字段说明：

| 变量 | 用途 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase 前端/匿名 key，后端可兼容读取 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key，兼容旧命名 |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务端写入数据库使用，不能暴露到浏览器 |
| `DATABASE_ENABLED` | 是否启用 Supabase 读写 |
| `DEEPSEEK_API_KEY` | DeepSeek API Key |
| `DEEPSEEK_BASE_URL` | DeepSeek OpenAI-compatible API 地址 |
| `DEEPSEEK_MODEL` | 使用的 DeepSeek 模型 |
| `AI_ENABLED` | 是否启用真实 AI 生成 |
| `NEWS_PROVIDER_MODE` | 新闻来源模式，本地测试使用 `local` |

注意：

- `.env.local` 不要提交到 Git。
- 不要把 API Key 发到公开群、截图或 PR 描述里。
- 如果只是测试接口形状，可以把 `DATABASE_ENABLED=false` 或 `AI_ENABLED=false` 暂时关闭真实服务。

## 6. 检查数据库连接

运行以下命令，确认本地后端能访问 Supabase 表：

```bash
node -e "const { loadEnvConfig } = require('@next/env'); loadEnvConfig(process.cwd()); const { createClient } = require('@supabase/supabase-js'); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); (async()=>{ for (const table of ['subscriptions','delivery_settings','daily_issues','topic_posters','creations','delivery_logs']) { const { count, error } = await supabase.from(table).select('*',{count:'exact',head:true}); console.log(table, error ? error.message : count); } })();"
```

正常输出示例：

```text
subscriptions 0
delivery_settings 0
daily_issues 1
topic_posters 2
creations 3
delivery_logs 1
```

只要不是 `fetch failed`、权限错误或表不存在，就说明连接基本正常。

## 7. 检查 DeepSeek 连接

运行：

```bash
node -e "const { loadEnvConfig } = require('@next/env'); loadEnvConfig(process.cwd()); const OpenAI = require('openai'); const client = new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY, baseURL: process.env.DEEPSEEK_BASE_URL }); (async()=>{ const res = await client.chat.completions.create({ model: process.env.DEEPSEEK_MODEL, messages: [{ role: 'system', content: '只输出合法 JSON。' }, { role: 'user', content: '返回 {\"ok\": true, \"message\": \"connected\"}' }], response_format: { type: 'json_object' }, max_tokens: 50, temperature: 0 }); console.log(res.choices[0].message.content); })();"
```

正常输出示例：

```json
{"ok": true, "message": "connected"}
```

如果失败：

- 检查 `DEEPSEEK_API_KEY` 是否正确；
- 检查 `DEEPSEEK_BASE_URL` 是否为 `https://api.deepseek.com`；
- 检查 `DEEPSEEK_MODEL` 是否为当前可用模型；
- 检查网络是否能访问 DeepSeek。

## 8. 启动后端

建议本地联调时让后端运行在 `3001`，避免和前端 `3000` 冲突：

```bash
npm run dev -- --port 3001
```

启动成功后应看到：

```text
Local: http://localhost:3001
Ready
```

后端 API 地址示例：

```text
http://localhost:3001/api/news/search
http://localhost:3001/api/daily-issue/generate
http://localhost:3001/api/theme-poster/generate
http://localhost:3001/api/topic-poster/generate
```

## 9. 后端 API 冒烟测试

### 9.1 搜索新闻

```bash
curl "http://localhost:3001/api/news/search?keyword=%E4%BA%BA%E5%B7%A5%E6%99%BA%E8%83%BD&timeRange=7d"
```

检查：

- HTTP 200；
- 返回 `query`、`timeRange`、`items`、`total`；
- `items` 至少 6 条；
- 每条新闻有 `source`、`publishedAt`、`angle`、`relevanceScore`。

### 9.2 生成日报

```bash
curl -X POST "http://localhost:3001/api/daily-issue/generate" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_01","topics":["人工智能","科技数码","商业财经"],"issueDate":"2026-07-18"}'
```

检查：

- 返回完整 `DailyIssue`；
- `sections` 至少 1 个；
- `leadArticleId` 存在于栏目新闻中；
- Supabase `daily_issues` 表有对应记录；
- 重复请求同一 `userId + issueDate` 不应产生重复日报。

### 9.3 生成主题海报

```bash
curl -X POST "http://localhost:3001/api/theme-poster/generate" \
  -H "Content-Type: application/json" \
  -d '{"theme":"人工智能","articleCount":4,"summaryLength":"standard","template":"classic"}'
```

检查：

- 返回完整 `ThemePosterContent`；
- `articles` 为 3 到 5 篇；
- `introduction`、`trendSummary`、`keywords` 不为空；
- Supabase `topic_posters` 表有 `kind=theme` 的记录。

### 9.4 生成关键词专题

先从搜索结果中取 3 到 5 个新闻 ID，再请求：

```bash
curl -X POST "http://localhost:3001/api/topic-poster/generate" \
  -H "Content-Type: application/json" \
  -d '{"keyword":"人工智能教育","articleIds":["id1","id2","id3","id4"],"template":"classic"}'
```

检查：

- 返回完整 `TopicPosterContent`；
- `articles` 为 3 到 5 篇；
- 返回顺序与 `articleIds` 顺序一致；
- Supabase `topic_posters` 表有 `kind=topic` 的记录。

### 9.5 模拟每日投递

```bash
curl -X POST "http://localhost:3001/api/delivery/simulate" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_01","issueDate":"2026-07-18"}'
```

检查：

- 返回 `DeliveryResult`；
- `issue` 是完整日报；
- `status` 为 `completed` 或 `partial`；
- 当前未接邮件时，`partial` 是正常结果；
- Supabase `delivery_logs` 表有记录。

## 10. 与前端本地联调

如果前端单独运行在：

```text
/Users/desrchfriedrich/Code/Ai_Daily_Paper_f
```

建议使用以下本地配置：

```bash
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_APP_URL=
API_PROXY_URL=http://127.0.0.1:3001
```

前端 `next.config.ts` 可通过 rewrite 将 `/api/*` 转发到后端：

```ts
async rewrites() {
  const apiProxyUrl = process.env.API_PROXY_URL;

  if (!apiProxyUrl) {
    return [];
  }

  return [
    {
      source: "/api/:path*",
      destination: `${apiProxyUrl}/api/:path*`,
    },
  ];
}
```

本地联调启动顺序：

```bash
# 1. 启动后端
cd /Users/desrchfriedrich/Code/Ai_Daily_Paper
npm run dev -- --port 3001

# 2. 启动前端
cd /Users/desrchfriedrich/Code/Ai_Daily_Paper_f
npm run dev -- --port 3000
```

访问：

```text
http://localhost:3000
```

## 11. 后端构建检查

提交或共享前，后端至少运行：

```bash
npm run typecheck
npm run build
```

通过标准：

- TypeScript 无错误；
- Next.js build 成功；
- 所有 API route 被识别为 dynamic route；
- 构建过程不输出密钥或敏感信息。

## 12. 常见问题

### 12.1 `DATABASE_ENABLED=true` 但仍没有写入 Supabase

检查：

- `.env.local` 是否在后端根目录；
- 是否重启了 `npm run dev`；
- `SUPABASE_SERVICE_ROLE_KEY` 是否正确；
- 表名是否与代码一致；
- `daily_issues` 是否有 `UNIQUE (user_id, issue_date)`。

### 12.2 DeepSeek 没有生成 AI 文案

检查：

- `AI_ENABLED=true`；
- `DEEPSEEK_API_KEY` 是否正确；
- `DEEPSEEK_BASE_URL=https://api.deepseek.com`；
- `DEEPSEEK_MODEL` 是否可用；
- 后端日志中是否有 API 超时或网络错误。

说明：

- 如果 DeepSeek 失败，后端会自动使用模板 fallback；
- 因此前端仍能看到结果，但文案可能更模板化。

### 12.3 前端请求不到后端

检查：

- 后端是否运行在 `http://localhost:3001`；
- 前端 `.env.local` 是否设置 `NEXT_PUBLIC_USE_MOCK_API=false`；
- 前端 `API_PROXY_URL` 是否为 `http://127.0.0.1:3001`；
- 前端是否重启；
- 访问 `http://localhost:3000/api/news/search?keyword=人工智能&timeRange=7d` 是否有 JSON 返回。

### 12.4 端口冲突

如果 `3001` 被占用：

```bash
npm run dev -- --port 3002
```

同时修改前端：

```bash
API_PROXY_URL=http://127.0.0.1:3002
```

### 12.5 返回图片 404

后端默认图片可能返回：

```text
/images/demo/news-placeholder.svg
```

前端 public 目录需要存在：

```text
public/images/demo/news-placeholder.svg
```

如果没有该文件，页面仍能运行，但新闻卡片图片会缺失。

## 13. 最小验收清单

本地后端部署完成后，应满足：

- [ ] `npm install` 成功。
- [ ] `.env.local` 已放在后端根目录。
- [ ] `DATABASE_ENABLED=true`。
- [ ] `AI_ENABLED=true`。
- [ ] Supabase 表访问测试通过。
- [ ] DeepSeek JSON 连接测试通过。
- [ ] `npm run dev -- --port 3001` 启动成功。
- [ ] `/api/news/search` 返回至少 6 条新闻。
- [ ] `/api/daily-issue/generate` 返回完整日报并写入 Supabase。
- [ ] `/api/theme-poster/generate` 返回 3 到 5 篇新闻。
- [ ] `/api/topic-poster/generate` 返回顺序与请求 ID 一致。
- [ ] `/api/delivery/simulate` 返回 `completed` 或 `partial`。
- [ ] `npm run typecheck` 通过。
- [ ] `npm run build` 通过。

完成以上步骤后，其他成员即可在本地用前端项目连接该后端进行页面级测试。
