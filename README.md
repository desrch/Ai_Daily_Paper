# 今日报纸 TodayPaper

基于 Next.js App Router 的 TodayPaper 前端工程。编号阶段 0～7 与最终交付收口均已完成：工程基础、设计系统、核心类型、演示数据、可替换 API Adapter、每日订阅、主题海报、关键词专题、固定演示路由、响应式、可访问性、联调契约与质量检查。

完整页面、流程、组件与数据层说明见 [TodayPaper 前端项目说明](./FRONTEND_PROJECT.md)。

## 本地运行

```bash
npm install
npm run dev
```

打开 <http://localhost:3000>。

## 质量检查

```bash
npm run check:frontend
```

该命令依次执行 lint、前端类型检查、前端测试、Demo 数据/Adapter/固定路由校验和生产构建。也可以按需单独执行：

```bash
npm run lint
npm run typecheck:frontend
npm run test:frontend
npm run validate:data
npm run validate:api
npm run validate:demo
npm run build
```

默认使用 Mock API。复制 `.env.example` 为本地环境文件后，可通过 `NEXT_PUBLIC_USE_MOCK_API` 控制 Mock/HTTP Client；不要提交 `.env.local`。

## 前后端联调

前端当前需要的数据模型、接口请求/响应、页面调用位置及与后端提示文档的差异，见 [前端数据与 API 契约](./docs/API_CONTRACT.md)。

最终页面、流程、断点与质量检查记录见 [前端验收报告](./docs/FRONTEND_ACCEPTANCE.md)。

固定演示入口：

- `/demo/home`
- `/demo/newspaper`
- `/demo/theme-poster`
- `/demo/topic-poster`

这些页面直接读取 `data/demo` 中的本地 JSON，不依赖登录、浏览器存储或外部服务。
