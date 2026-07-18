# TodayPaper 四人分工与 GitHub 完整交付流程

> 适用项目：今日报纸 TodayPaper  
> 目标仓库：<https://github.com/desrch/Ai_Daily_Paper>  
> 项目周期：约 2 天  
> 依据文档：[`TodayPaper-产品设计文档.md`](./TodayPaper-产品设计文档.md)

---

## 1. 人员口径与协作原则

- 2 人负责 Coding；
- 1 人负责 PPT 与展示；
- 1 人负责部署与测试。

本文采用以下人员口径：

四人分别负责前端、后端、PPT 展示、部署测试。



### 1.1 五人的最终组织

| 人员 | 角色 | 核心责任 |

| 1 号 | 前端与视觉开发 | 页面、交互、日报与海报模板、响应式、导出 |
| 2 号 | 后端与 AI 开发 | 新闻数据、排序去重、AI 结构化生成、数据库接口 |
| 3 号 | PPT 与展示负责人 | 品牌素材、PPT、讲稿、演示视频、现场操作 |
| 4 号 | 部署与测试负责人 | Supabase、邮件、定时任务、Vercel、测试与发布 |

### 1.2 强制协作原则

1. 三个核心功能不可删减：
   - 每日订阅日报；
   - 主题新闻海报；
   - 关键词专题海报。
2. 先完成 P0 闭环，再增加模板或高级功能。
3. `main` 始终保持可部署，`develop` 用于日常集成。
4. 不直接向 `main` 或 `develop` 推送业务代码。
5. 一个 Issue 对应一个任务，一个分支对应一个功能，一个 PR 对应一次可独立验收的修改。
6. 前后端共同使用冻结后的 TypeScript 类型和 Mock JSON。
7. 所有密钥只保存在本地或部署平台环境变量中，禁止提交 `.env.local`。
8. 每个核心流程都必须有固定演示数据和降级路径。

---

## 2. 四位执行成员的具体分工

## 2.1 1 号：前端与视觉开发

### 工作目标

按照项目预览图实现统一的“现代中文报纸”视觉体系，并完成三个核心功能的全部页面与交互。

### 负责页面

#### A. 公共页面

- 产品首页；
- 全局导航；
- 通用加载、空、错误和成功状态；
- 响应式布局；
- Toast、Dialog、Button、Card 等公共组件。

#### B. 每日订阅模块

- 首次订阅设置页；
- 用户主页 / 日报收件箱；
- 日报详情页；
- 订阅管理页；
- 历史作品页。

#### C. 主题海报模块

- 主题选择；
- 摘要长度、新闻数量和模板选择；
- 四阶段生成进度；
- 主题海报预览；
- 保存和下载按钮。

#### D. 关键词专题模块

- 关键词搜索框；
- 时间范围筛选；
- 候选新闻列表；
- 相关性分数与报道角度标签；
- 3～5 篇多选；
- 取消、替换和排序；
- 专题长海报预览。

#### E. 固定演示页面

- `/demo/home`
- `/demo/newspaper`
- `/demo/theme-poster`
- `/demo/topic-poster`

以上页面直接读取本地 JSON 和图片，不调用外部服务。

### 必须交付的公共组件

```text
components/
├── layout/
│   ├── Header
│   └── PageContainer
├── news/
│   ├── NewsCard
│   ├── SourceMeta
│   ├── RelevanceBadge
│   └── AngleBadge
├── newspaper/
│   ├── NewspaperMasthead
│   ├── LeadArticle
│   ├── DailyBriefing
│   ├── NewspaperSection
│   └── SourceList
├── poster/
│   ├── ThemePoster
│   ├── TopicPoster
│   └── ExportActions
└── states/
    ├── LoadingSteps
    ├── EmptyState
    └── ErrorState
```

### 与后端的接口约定

前端不得根据临时返回值自行增加字段。统一使用：

- `NewsArticle`
- `DailyIssue`
- `TopicPosterContent`

后端接口未完成前，前端使用与真实接口完全同结构的 Mock JSON。

### 建议分支与 Issue

| Issue | 分支 |
|---|---|
| 初始化前端设计系统和公共组件 | `feature/ui-foundation` |
| 完成首页、订阅设置与用户主页 | `feature/subscription-pages` |
| 完成经典日报详情模板 | `feature/newspaper-template` |
| 完成主题海报生成和预览 | `feature/theme-poster-ui` |
| 完成关键词搜索和专题海报 | `feature/topic-poster-ui` |
| 完成固定演示页面 | `feature/demo-pages` |
| 完成响应式与导出功能 | `feature/responsive-export` |

### 验收标准

- 页面整体风格与预览图一致；
- 三个核心入口均可从首页进入；
- 所有核心页面均有加载、成功、空和错误状态；
- 日报和海报必须显示来源、发布时间和原文入口；
- 关键词新闻可选择、取消、替换和排序；
- 桌面端可完整演示，移动端无明显布局错位；
- 外部接口断开后四个 `/demo` 页面仍可使用。

### 不负责

- 新闻 API 抓取逻辑；
- LLM Prompt 和结构化输出；
- 数据库表设计；
- Vercel、Supabase、Resend 的生产配置。

---

## 2.2 2 号：后端、新闻聚合与 AI 开发

### 工作目标

建立从“新闻获取”到“结构化日报 / 海报 JSON”的数据链路，为前端提供稳定接口和固定演示数据。

### 负责内容

#### A. 新闻数据层

- 获取 RSS、新闻 API 或演示数据；
- 将不同数据源转换为统一 `NewsArticle`；
- 处理缺失图片、缺失描述和异常时间；
- 保存用于离线演示的固定新闻数据。

#### B. 排序与去重

- 关键词相关度；
- 时效性；
- 来源质量；
- 内容完整度；
- 标题相似度去重；
- 摘要相似度去重；
- 同源转载过滤；
- 关键词专题的报道角度多样性。

综合排序基线：

```text
综合分数 =
关键词相关度 × 50%
+ 时效性 × 20%
+ 来源质量 × 15%
+ 内容完整度 × 15%
```

#### C. AI 结构化生成

- 新闻精简标题；
- 单篇摘要；
- 栏目分类；
- 今日头条选择；
- AI 今日导读；
- 今日速览；
- 值得继续关注；
- 主题海报导语与趋势总结；
- 关键词专题导语、文章角度和关键结论。

AI 只输出结构化文字 JSON，不直接生成含中文文字的整张海报图片。

#### D. 后端接口

```text
GET  /api/news/search
POST /api/news/rank
POST /api/daily-issue/generate
POST /api/theme-poster/generate
POST /api/topic-poster/generate

GET  /api/subscriptions
POST /api/subscriptions
PATCH /api/subscriptions/:id
DELETE /api/subscriptions/:id

GET  /api/daily-issues
GET  /api/creations
```

#### E. 数据库读写逻辑

- 订阅的增删改查；
- 日报保存与读取；
- 主题海报保存；
- 历史作品读取；
- `user_id + issue_date` 防重复处理。

数据库和部署平台由 4 号建立，2 号负责应用代码中的读写逻辑。

#### F. 降级策略

- 新闻 API 失败：使用缓存或本地 JSON；
- AI 失败：使用原始标题、`description` 和模板文案；
- AI JSON 格式错误：尝试修复一次，再进入非 AI 降级；
- 新闻不足：扩大时间范围，仍不足时使用演示数据；
- 图片缺失：返回本地默认图片。

### 建议分支与 Issue

| Issue | 分支 |
|---|---|
| 冻结核心类型和 Mock 数据 | `feature/core-data-contracts` |
| 实现新闻搜索与统一格式 | `feature/news-search` |
| 实现排序、去重与角度筛选 | `feature/news-ranking` |
| 实现日报结构化生成 | `feature/daily-issue-api` |
| 实现主题海报生成 | `feature/theme-poster-api` |
| 实现关键词专题生成 | `feature/topic-poster-api` |
| 实现 Supabase 数据读写 | `feature/persistence-api` |
| 实现 AI 和新闻源降级 | `feature/fallback-data` |

### 验收标准

- 所有生成接口返回冻结后的类型；
- 关键词搜索结果包含相关性分数和报道角度；
- 同一事件的明显转载不会同时进入最终结果；
- 日报按订阅方向形成栏目；
- 主题与关键词海报均包含 3～5 篇新闻；
- 每条新闻包含真实来源和时间；
- 同一用户同一天只生成一份日报；
- AI 或新闻 API 不可用时仍返回可渲染结果。

### 不负责

- 页面布局和视觉还原；
- PPT 与讲稿；
- 生产环境配置和最终发布；
- 完整回归测试。

---

## 2.3 3 号：PPT、品牌素材与现场展示

### 工作目标

将产品价值、功能闭环和技术亮点整理为一场 3～5 分钟可以稳定完成的展示。

### 负责内容

#### A. 品牌与展示素材

- TodayPaper Logo；
- 主色、字体和图标使用规范；
- 产品二维码；
- PPT 封面和统一页面模板；
- 邮件展示截图；
- 日报和海报效果截图；
- 30～60 秒备用演示视频。

品牌规范要先交给 1 号，避免前端后期返工。

#### B. PPT 建议结构

1. 用户痛点；
2. 产品定位和宣传语；
3. 三个核心功能；
4. 每日订阅流程；
5. 主题与关键词海报的差异；
6. AI、新闻聚合和模板渲染的技术流程；
7. 产品页面与演示案例；
8. 团队分工；
9. 当前成果和未来计划。

#### C. 现场演示脚本

##### 第一段：每日订阅

```text
选择 AI、科技、商业
→ 保存每日 08:00 投递
→ 点击“模拟每日 8 点”
→ 主页出现今日报纸
→ 展示邮件
→ 打开完整日报
```

##### 第二段：主题海报

```text
选择“人工智能”
→ 生成多新闻主题海报
→ 展示导语、趋势和来源
→ 保存或下载
```

##### 第三段：关键词专题

```text
搜索“人工智能教育”
→ 查看相关度和报道角度
→ 选择并调整 4 篇新闻
→ 生成专题长海报
```

#### D. 演示保险

- 在线生产环境；
- 四个固定 `/demo` 页面；
- 本地运行版本；
- 演示视频；
- 关键页面静态截图；
- PPT 中嵌入备用结果图。

### 建议分支与 Issue

| Issue | 分支 |
|---|---|
| 确定 Logo 和展示视觉规范 | `design/brand-system` |
| 制作答辩 PPT | `design/presentation` |
| 编写演示讲稿 | `docs/demo-script` |
| 准备截图、二维码和备用视频 | `design/demo-assets` |

### 仓库交付目录

```text
docs/presentation/
├── TodayPaper-答辩PPT.pptx
├── TodayPaper-演示讲稿.md
├── TodayPaper-演示流程.md
└── screenshots/

public/brand/
├── logo.svg
├── logo-dark.svg
└── qr-code.png
```

大视频文件不建议直接提交 Git。若必须提交，先确认仓库是否启用 Git LFS；否则上传云盘，并在文档中保存访问链接。

### 验收标准

- PPT 可在 3～5 分钟内讲完；
- 三个核心功能都有对应页面或动图；
- 架构图与真实实现一致；
- 二维码可以打开生产网站；
- 在线、离线和视频三种演示方式至少准备两种；
- 演示讲稿标注每一步操作人和预计时间。

### 不负责

- 修改核心业务代码；
- 配置生产数据库；
- 决定临时新增功能；
- 在演示前擅自更新生产分支。

---

## 2.4 4 号：部署、数据库、邮件与测试

### 工作目标

确保项目能在 Vercel 稳定访问，关键数据能够保存，每日任务和邮件链路可演示，并对最终版本进行 P0 验收。

### 负责内容

#### A. 工程和环境

- GitHub 仓库协作者与分支保护；
- `.env.example`；
- Supabase 项目；
- Vercel 项目；
- Resend 或替代邮件服务；
- 环境变量；
- 数据库迁移；
- 生产构建和部署。

#### B. 数据库

建立并维护：

```text
users
subscriptions
delivery_settings
daily_issues
topic_posters
search_history
delivery_logs
```

必须建立：

```text
UNIQUE (user_id, issue_date)
```

#### C. 定时与邮件

- `/api/cron/daily-delivery`；
- `/api/delivery/simulate`；
- `/api/email/send`；
- 每日 08:00 调度；
- 演示按钮即时触发；
- 投递日志；
- 邮件失败重试或错误记录。

#### D. 测试

- 核心接口冒烟测试；
- 三条端到端主流程；
- 重复生成测试；
- 新闻 API 失败测试；
- AI API 失败测试；
- 邮件失败测试；
- 桌面端与移动端测试；
- Chrome 浏览器优先；
- 固定演示页面断网测试；
- Vercel 生产环境回归。

#### E. 发布

- 维护发布检查清单；
- 每次部署记录 commit SHA；
- 将 `develop` 的验收版本合并至 `main`；
- 创建 Git tag；
- 发布后完成生产冒烟测试；
- 发现 P0 问题时从 `main` 创建 Hotfix。

### 建议分支与 Issue

| Issue | 分支 |
|---|---|
| 配置 Supabase 与迁移 | `feature/supabase-setup` |
| 配置邮件投递 | `feature/email-delivery` |
| 配置 Cron 与模拟投递 | `feature/daily-cron` |
| 配置 Vercel 与环境变量 | `chore/vercel-deployment` |
| 增加 CI 检查 | `chore/github-actions` |
| 完成 P0 测试与 Bug 清单 | `docs/release-checklist` |

### 验收标准

- 生产 URL 可以公开访问；
- 环境变量没有进入 Git；
- 数据库迁移可以重复执行或有清晰说明；
- 模拟投递能够生成并保存日报；
- 邮件成功或失败都有日志；
- 重复触发不会产生第二份今日日报；
- 四个 `/demo` 页面断开外部服务后仍可访问；
- `main` 最新 commit 通过构建和 P0 冒烟测试。

### 不负责

- 重新设计页面；
- 修改产品范围；
- 编写大段 AI 生成逻辑；
- 制作答辩 PPT。

---

## 3. 产品负责人 / 组长的工作

你作为第 5 人主要负责：

- 冻结 P0、P1、P2 范围；
- 将需求拆为 Issue 并指定负责人；
- 决定字段和接口争议；
- 每 3～4 小时组织一次 10 分钟同步；
- 验收三个核心功能；
- 控制合并顺序；
- 冻结最终演示版本；
- 决定是否允许延期功能进入最终版本。

项目过程中不要临时改变核心数据类型或视觉方向。任何新增需求必须先回答：

1. 是否影响 P0？
2. 是否能在 1 小时内完成并测试？
3. 是否需要两位 Coding 成员同时修改同一文件？

不能同时满足安全条件的新增需求进入 P1 或 P2。

---

## 4. 两天协作时间表

## Day 1 上午：冻结契约并并行开工

### 全员

- 阅读产品设计文档；
- 确认 P0；
- 确认页面路由；
- 冻结三个核心 TypeScript 类型；
- 创建 Issues、标签和 Project 看板。

### 1 号

- 搭建设计系统；
- 完成首页、导航和公共布局；
- 使用 Mock JSON 开始日报页面。

### 2 号

- 冻结类型；
- 准备三套演示 JSON；
- 实现新闻搜索与统一格式。

### 3 号

- 确认 Logo、颜色和字体；
- 搭建 PPT 母版；
- 编写演示故事线。

### 4 号

- 配置 GitHub 协作规则；
- 建立 Supabase、Vercel 和邮件服务；
- 准备 `.env.example` 和数据库迁移。

## Day 1 下午：完成三条主流程骨架

- 1 号完成订阅、日报、主题海报和关键词搜索页面骨架；
- 2 号完成排序去重和三个生成接口；
- 3 号收集页面进度并完成 PPT 前半部分；
- 4 号完成数据库、部署预览和基础测试。

## Day 1 晚上：第一次集成

- 两位 Coding 成员分别提交 PR；
- 4 号在 `develop` 做第一次集成部署；
- 修复接口字段、CORS、图片域名和环境变量问题；
- 组长按三个核心流程进行第一次验收。

## Day 2 上午：完成闭环

- 串联真实接口；
- 完成保存、历史记录、邮件、Cron 和模拟投递；
- 完成固定演示页面；
- 完成海报预览和下载；
- 补齐错误与降级状态。

## Day 2 下午：测试与展示

- 4 号执行 P0 回归；
- 1、2 号只修复 P0 和 P1 Bug；
- 3 号完成 PPT、讲稿、二维码和备用视频；
- 组长冻结产品文案与演示数据。

## Day 2 晚上：发布冻结

- 将验收通过的 `develop` 合并到 `main`；
- 创建版本标签；
- 部署生产环境；
- 完成生产冒烟测试；
- 全员彩排两次；
- 冻结代码，除 P0 Hotfix 外不再合并。

---

## 5. GitHub 仓库当前状态

截至文档创建时：

- 远程仓库是公开空仓库；
- 本地目录已经执行过 `git init`；
- 本地当前分支为 `main`；
- 本地还没有 commit；
- 本地还没有配置远程仓库；
- `.editorconfig`、`.env.example`、`.github/`、`.gitignore`、`CONTRIBUTING.md` 和 `docs/` 均尚未跟踪。

因此应由一名负责人完成首次提交，其他成员再 clone，不能让多人分别初始化后强行推送。

---

## 6. 首次上传到 GitHub 的完整流程

以下操作只由组长或 4 号执行一次。

### 6.1 上传前检查

```bash
cd "/Users/shanse/Desktop/vibe coding"
git status
git branch --show-current
git remote -v
```

检查 `.gitignore` 至少包含：

```text
node_modules/
.next/
.env
.env.local
.env.*.local
*.log
.DS_Store
```

检查暂存文件中没有：

- API Key；
- Supabase Service Role Key；
- Resend Key；
- 数据库密码；
- 真实用户邮箱；
- Cookie、Token 或本地日志。

### 6.2 配置远程仓库

```bash
git remote add origin https://github.com/desrch/Ai_Daily_Paper.git
git remote -v
```

如果已经存在名为 `origin` 的远程，不要重复添加；先确认地址，再按需要使用：

```bash
git remote set-url origin https://github.com/desrch/Ai_Daily_Paper.git
```

### 6.3 创建首次提交

```bash
git add .editorconfig .env.example .github .gitignore CONTRIBUTING.md docs
git diff --cached --stat
git diff --cached
git commit -m "chore: initialize TodayPaper project"
```

检查 diff 时不要在公开截图或聊天中暴露密钥。

### 6.4 首次推送 `main`

```bash
git push -u origin main
```

如果通过 HTTPS 推送，使用 GitHub 登录授权或 Personal Access Token，不要使用账户密码。

### 6.5 创建并推送 `develop`

```bash
git switch -c develop
git push -u origin develop
```

之后日常功能分支全部从最新 `develop` 创建。

---

## 7. GitHub 仓库配置

由组长或 4 号在 GitHub 网页完成。

### 7.1 添加协作者

进入：

```text
Settings
→ Collaborators and teams
→ Add people
```

邀请其余四名成员。成员接受邀请后再开始推送。

### 7.2 设置默认分支

建议将默认分支设为 `develop`，便于成员创建 PR 时默认进入集成分支：

```text
Settings
→ Branches
→ Default branch
→ develop
```

项目发布完成后可以再把默认分支改回 `main`。

### 7.3 保护 `main`

建议规则：

- Require a pull request before merging；
- Require at least 1 approval；
- Dismiss stale approvals when new commits are pushed；
- Require status checks to pass；
- Block force pushes；
- Block deletions。

### 7.4 保护 `develop`

建议规则：

- Require a pull request before merging；
- Require at least 1 approval；
- Require status checks to pass；
- Block force pushes。

### 7.5 创建标签

```text
P0
P1
P2
frontend
backend
database
deployment
design
testing
bug
blocked
```

### 7.6 创建 Project 看板

```text
Backlog
Todo
In Progress
Review
Testing
Done
Blocked
```

---

## 8. 每位成员的日常 Git 流程

### 8.1 第一次获取项目

```bash
git clone https://github.com/desrch/Ai_Daily_Paper.git
cd Ai_Daily_Paper
git switch develop
git pull --ff-only origin develop
```

每位成员在本地创建自己的 `.env.local`，禁止复制他人的密钥文件到仓库。

### 8.2 领取 Issue

开始前必须：

1. 将 Issue 分配给自己；
2. 将看板状态改为 `In Progress`；
3. 确认验收标准和依赖 Issue；
4. 从最新 `develop` 创建分支。

### 8.3 创建功能分支

```bash
git switch develop
git pull --ff-only origin develop
git switch -c feature/news-search
```

常用前缀：

```text
feature/
fix/
docs/
design/
chore/
hotfix/
```

### 8.4 开发中提交

```bash
git status
git diff
git add <本次任务相关文件>
git diff --cached
git commit -m "feat: add news search and ranking"
```

不要直接使用 `git add .` 混入无关文件。一次 commit 只表达一个清晰意图。

提交信息示例：

```text
feat: add newspaper subscription pages
feat: add topic poster generation
fix: prevent duplicate daily issues
design: add TodayPaper presentation assets
test: add daily delivery smoke tests
docs: add demo script
chore: configure Vercel deployment
```

### 8.5 同步最新 `develop`

创建 PR 前：

```bash
git fetch origin
git rebase origin/develop
```

如果团队成员不熟悉 rebase，可以使用：

```bash
git merge origin/develop
```

发生冲突时不要删除不理解的代码。先联系对应文件负责人，共同确认保留内容。

### 8.6 推送功能分支

```bash
git push -u origin feature/news-search
```

如果 rebase 后远程分支已有旧提交，需要更新远程时，优先使用：

```bash
git push --force-with-lease
```

禁止使用无保护的 `git push --force`。

### 8.7 创建 PR

PR 目标分支：

```text
feature/* → develop
fix/*     → develop
docs/*    → develop
design/*  → develop
chore/*   → develop
```

PR 必须包含：

- 关联 Issue；
- 完成内容；
- 测试方式和结果；
- 页面截图；
- 环境变量变化；
- 数据库变化；
- 已知风险；
- 降级或回滚方式。

PR 标题示例：

```text
[Frontend] 完成每日订阅与用户主页
[Backend] 完成新闻排序与去重
[Deploy] 配置 Supabase 和 Vercel
[Design] 添加答辩 PPT 与演示素材
```

### 8.8 Code Review

建议审查分配：

| PR 类型 | 第一审查人 | 验收人 |
|---|---|---|
| 前端页面 | 2 号检查接口契约 | 组长检查产品 |
| 后端接口 | 1 号检查返回数据可用性 | 4 号检查错误与部署 |
| 部署与数据库 | 2 号检查应用依赖 | 组长检查可用性 |
| PPT 与素材 | 1 号检查页面一致性 | 组长检查讲解 |

有 Review 意见时：

1. 在原分支继续修改；
2. 提交并 push；
3. 回复每条意见；
4. 审查人确认后 Resolve；
5. 所有检查通过后再合并。

推荐使用 **Squash and merge**，使 `develop` 历史清晰。

---

## 9. 两位 Coding 成员的集成规则

### 9.1 降低冲突

1 号主要修改：

```text
app/
components/
styles/
public/
```

2 号主要修改：

```text
app/api/
lib/news/
lib/ai/
lib/db/
types/
data/
```

容易冲突的共享文件：

```text
package.json
app/layout.tsx
types/index.ts
.env.example
middleware.ts
```

修改共享文件前在群里说明，指定一人完成，另一人通过 PR 提建议。

### 9.2 接口先行

Day 1 上午必须先提交：

- `types/`；
- `data/demo/`；
- 接口请求和返回示例；
- 错误结构。

统一错误格式建议：

```ts
interface ApiError {
  code: string;
  message: string;
  retryable: boolean;
}
```

### 9.3 集成顺序

建议依次合并到 `develop`：

1. 工程初始化；
2. 核心类型和 Mock 数据；
3. 前端公共组件；
4. 新闻搜索、排序和去重；
5. 日报生成；
6. 日报页面；
7. 主题海报接口与页面；
8. 关键词专题接口与页面；
9. Supabase、邮件和 Cron；
10. 固定演示页面；
11. 测试、文档和展示素材。

---

## 10. `develop` 到 `main` 的最终发布流程

只由组长或 4 号执行。

### 10.1 发布前冻结

- 暂停合并 P1、P2；
- 看板中所有 P0 必须为 `Done`；
- 确认 `develop` 的 Vercel Preview 可用；
- 记录候选发布 commit SHA；
- 完成三条演示流程；
- 完成断网演示；
- 完成 `npm run lint`、`npm run typecheck`、`npm run build`；
- 确认 `.env.example` 和数据库迁移文档最新。

### 10.2 创建发布 PR

```text
源分支：develop
目标分支：main
标题：release: TodayPaper MVP v1.0.0
```

发布 PR 应包含：

- 三个核心功能状态；
- 测试结果；
- 生产环境变量清单；
- 数据库迁移说明；
- 已知问题；
- 回滚方式；
- 演示链接和截图。

### 10.3 合并并同步本地

发布 PR 通过后：

```bash
git switch main
git pull --ff-only origin main
```

### 10.4 创建版本标签

```bash
git tag -a v1.0.0 -m "TodayPaper MVP demo release"
git push origin v1.0.0
```

### 10.5 生产部署

在 Vercel 中：

- Production Branch 设置为 `main`；
- 配置全部生产环境变量；
- 触发生产部署；
- 记录部署 URL 和 commit SHA。

### 10.6 生产冒烟测试

至少验证：

- 首页可打开；
- 订阅可以保存；
- 模拟每日 8 点可生成日报；
- 日报保存到主页；
- 邮件链路有明确结果；
- 主题海报可以生成；
- 关键词专题可以生成；
- 历史作品可以打开；
- 四个 `/demo` 页面可访问；
- 手机端没有阻断性布局问题。

---

## 11. 发布后 Hotfix 流程

只有阻断演示或核心流程的 P0 Bug 才使用 Hotfix。

```bash
git switch main
git pull --ff-only origin main
git switch -c hotfix/<问题名称>
```

修复和自测后：

```bash
git add <修复相关文件>
git diff --cached
git commit -m "fix: <问题说明>"
git push -u origin hotfix/<问题名称>
```

创建：

```text
hotfix/* → main
```

的 PR。合并并验证生产环境后，再将修复同步回 `develop`：

```text
main → develop
```

避免下次发布重新引入相同问题。

---

## 12. 最终仓库应包含的内容

```text
Ai_Daily_Paper/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   ├── workflows/
│   └── PULL_REQUEST_TEMPLATE.md
├── app/
│   ├── api/
│   ├── demo/
│   └── ...
├── components/
├── data/
│   └── demo/
├── docs/
│   ├── TodayPaper-产品设计文档.md
│   ├── TodayPaper-四人分工与GitHub交付流程.md
│   ├── presentation/
│   └── previews/
├── lib/
├── public/
├── supabase/
│   └── migrations/
├── tests/
├── types/
├── .env.example
├── .gitignore
├── CONTRIBUTING.md
├── README.md
├── package.json
└── vercel.json
```

---

## 13. 最终交付检查清单

### 代码

- [ ] `main` 可构建、可部署；
- [ ] `develop` 已同步最终修复；
- [ ] 三个核心功能完整；
- [ ] 固定演示页完整；
- [ ] 没有提交密钥或真实用户数据；
- [ ] 数据库迁移和 `.env.example` 完整。

### GitHub

- [ ] 所有 P0 Issue 已关闭；
- [ ] 所有核心代码通过 PR 合并；
- [ ] `main` 和 `develop` 已保护；
- [ ] CI 通过；
- [ ] 创建 `v1.0.0` 标签；
- [ ] README 包含项目介绍、截图、运行步骤和生产链接。

### 部署

- [ ] Vercel 生产环境可访问；
- [ ] Supabase 可用；
- [ ] 邮件服务有成功或明确降级；
- [ ] 定时任务已配置；
- [ ] 生产环境冒烟测试通过；
- [ ] 二维码指向正确地址。

### 展示

- [ ] PPT 最终版；
- [ ] 3～5 分钟讲稿；
- [ ] 三条演示流程；
- [ ] 本地或 `/demo` 备用方案；
- [ ] 演示视频或静态截图；
- [ ] 全员完成至少两次彩排。

---

## 14. 最重要的执行顺序

```text
冻结需求与数据类型
→ 首次上传空仓库基础文件
→ 创建 develop 和仓库保护
→ 创建 Issues 与分支
→ 两位 Coding 并行开发
→ 通过 PR 合并到 develop
→ Preview 环境持续集成测试
→ 完成 PPT、部署和固定演示
→ 冻结 P0
→ develop 通过发布 PR 合并 main
→ 创建 v1.0.0
→ 生产部署与冒烟测试
→ 彩排并锁定演示版本
```

项目时间只有两天，最终判断标准不是“完成了多少页面”，而是三个核心功能是否形成可稳定演示的完整闭环。
