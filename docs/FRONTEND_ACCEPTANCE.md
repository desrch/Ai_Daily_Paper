# TodayPaper 前端验收报告

> 验收日期：2026-07-18  
> 范围：一号前端阶段 0～7、联调预留与最终交付收口  
> 结论：前端范围完成，可继续使用 Mock 演示，也可在契约确认后切换真实 HTTP Client

## 1. 页面与路由

以下 14 个要求路由均已打开并检查：

| 模块 | 路由 |
|---|---|
| 首页与订阅 | `/`、`/onboarding`、`/dashboard`、`/subscriptions` |
| 日报与历史 | `/newspaper/demo-daily`、`/creations` |
| 主题海报 | `/theme-poster`、`/theme-poster/demo-theme` |
| 关键词专题 | `/topic-search`、`/topic-poster/demo-topic` |
| 固定演示 | `/demo/home`、`/demo/newspaper`、`/demo/theme-poster`、`/demo/topic-poster` |

动态生成的日报、主题海报和专题海报 ID 也已分别打开检查。不存在的动态内容由友好错误状态承接，未知路由由 `app/not-found.tsx` 承接。

## 2. 核心流程

| 流程 | 验收结果 |
|---|---|
| A. 首页 → 设置 AI/科技/商业订阅 → 保存 → Dashboard → 模拟 8 点投递 → 日报详情 | 通过；重复投递返回当日已有日报，日报同步进入历史作品 |
| B. 主题海报 → 选择主题 → 生成 4 篇聚合海报 → 保存 → 历史作品 | 通过；海报详情可按动态 ID 读取，保存后出现在历史作品 |
| C. 搜索“人工智能教育” → 选择 4 篇不同角度新闻 → 调整顺序 → 生成专题 → 保存与下载 | 通过；生成结果保持调整后的顺序，PNG 长图成功触发浏览器下载，保存后进入历史作品 |
| D. 四个 `/demo` 页面不调用外部服务 | 通过；页面直接读取本地 JSON，静态校验确认未引用 API Client、`fetch` 或 `localStorage` |

## 3. 响应式与可访问性

- 在 375、768、1024、1440px 下，对 Dashboard、日报、主题海报、专题搜索和专题海报执行 20 组检查；无横向溢出或标题缺失。
- 375px 移动导航支持 Enter 打开、Escape 关闭；打开后焦点进入第一个链接，关闭后焦点回到菜单按钮。
- 键盘焦点环实测为 2px solid。
- 表单具有关联 Label，图标按钮提供可访问名称；Loading、Empty、Error、Success 和部分成功状态均有语义化反馈。

## 4. 自动化检查

一键前端检查：

```bash
npm run check:frontend
```

2026-07-18 结果：

- ESLint：0 error；3 个 warning 位于后端归属文件；
- 前端 TypeScript：通过；
- 全项目 TypeScript：通过；
- 前端测试：4 个测试文件、14 个测试全部通过；
- Demo 数据：8 篇候选、5 种角度、3 个日报栏目、10 条历史作品，校验通过；
- Mock API Adapter：订阅、日报幂等、主题/专题生成、保存回流与错误注入冒烟通过；
- HTTP Client：路径、方法、Query、请求体、动态 ID 编码、输入校验与错误转换测试通过；
- 固定演示：4 个页面本地数据依赖校验通过；
- Next.js 生产构建：通过，14/14 个静态页面生成成功；
- 密钥扫描：未发现已填写的密钥、Token 或本地环境文件。

全仓库 `npm test` 当前为 83/86 通过。3 个失败均属于二号后端负责的新闻排序/角度逻辑，本次按前端边界未修改：

- `tests/backend/angles.test.ts`：同角度后续文章惩罚；
- `tests/backend/rank.test.ts`：多角度选择数量；
- `tests/backend/ranking.test.ts`：完整度评分。

## 5. 联调状态

- `NEXT_PUBLIC_USE_MOCK_API=true`：使用当前完整 Mock 流程；
- `NEXT_PUBLIC_USE_MOCK_API=false`：切换 `HttpClient`；
- 页面只依赖 `TodayPaperApiClient`，普通业务页面不直接读取 Demo JSON；
- 请求和响应均经过 Zod 校验，标准错误结构为 `{ code, message, retryable }`；
- 完整接口、调用页面、字段约束、差异和联调顺序见 [`API_CONTRACT.md`](./API_CONTRACT.md)。

`POST /api/news/rank`、`PATCH /api/subscriptions/:id`、`DELETE /api/subscriptions/:id` 当前没有冻结的页面请求/响应字段，也没有前端调用。为避免自行假设后端字段，联调前需先共同确认是否保留为服务端内部能力，或再扩展 Adapter。

## 6. 后端与部署待办

以下不属于一号前端阶段，仍需对应成员提供：

- 真实新闻聚合、规范化、去重、排序与报道角度分类；
- 真实 LLM 摘要和结构化生成；
- 数据库持久化、用户登录与权限；
- 邮件发送、每日 Cron 和失败重试；
- 与前端确认成功/错误包裹、参数命名、分页和详情接口差异；
- 在真实接口环境关闭 Mock 后执行最后一轮联调回归。

