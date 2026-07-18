# 新闻数据 JSON 模板说明

对应模板文件：`data/templates/news-data-template.json`

本文档用于统一不同成员抓取的新闻数据格式。爬虫成员只需要按模板填写 JSON，后端会读取其中的 `articles` 数组进行标准化、排序、去重和 AI 生成。

## 1. 总体结构

```json
{
  "schemaVersion": "1.0.0",
  "batchId": "news-batch-2026-07-18-ai-001",
  "provider": {},
  "crawl": {},
  "articles": [],
  "_schema": {}
}
```

字段分为五类：

| 字段 | 是否必填 | 含义 |
|---|---|---|
| `schemaVersion` | 必填 | 模板版本号，用于后续格式升级 |
| `batchId` | 必填 | 本次抓取批次 ID，方便排查和追踪 |
| `provider` | 必填 | 数据来源或抓取成员信息 |
| `crawl` | 必填 | 本次抓取任务的信息 |
| `articles` | 必填 | 新闻列表，后端主要读取这个字段 |
| `_schema` | 可选 | 字段说明，真实交付数据中可以保留，也可以删除 |

## 2. 顶层字段说明

### 2.1 `schemaVersion`

模板版本号。

示例：

```json
"schemaVersion": "1.0.0"
```

填写规则：

- 目前固定填写 `"1.0.0"`。
- 如果后续字段结构有明显变化，再升级版本号。

### 2.2 `batchId`

本次抓取任务的唯一标识。

示例：

```json
"batchId": "news-batch-2026-07-18-ai-001"
```

建议格式：

```text
news-batch-日期-主题-序号
```

例如：

```text
news-batch-2026-07-18-ai-001
news-batch-2026-07-18-business-001
news-batch-2026-07-18-ai-education-001
```

用途：

- 区分不同成员、不同关键词、不同时间抓取的数据。
- 后端或测试发现问题时，可以快速定位是哪一批数据。

## 3. `provider` 字段说明

`provider` 用于描述新闻数据从哪里来、由谁抓取。

示例：

```json
"provider": {
  "name": "crawler-member-name",
  "sourceType": "rss",
  "sourceName": "Example News Source",
  "sourceHomepage": "https://example.com"
}
```

| 字段 | 是否必填 | 含义 | 示例 |
|---|---|---|---|
| `name` | 必填 | 抓取成员或脚本名称 | `"zhangsan"`、`"rss-crawler"` |
| `sourceType` | 必填 | 新闻来源类型 | `"rss"`、`"news_api"`、`"website"` |
| `sourceName` | 必填 | 新闻来源名称 | `"BBC"`、`"36氪"`、`"人民网"` |
| `sourceHomepage` | 可选 | 来源首页 | `"https://example.com"` |

`sourceType` 建议只使用以下值：

```text
rss
news_api
website
manual
demo
```

说明：

- `rss`：RSS 源。
- `news_api`：新闻 API。
- `website`：网页爬取。
- `manual`：手动整理。
- `demo`：固定演示数据。

## 4. `crawl` 字段说明

`crawl` 用于记录本次抓取任务本身的信息。

示例：

```json
"crawl": {
  "keyword": "人工智能",
  "category": "人工智能",
  "timeRange": "24h",
  "crawledAt": "2026-07-18T08:00:00+08:00",
  "timezone": "Asia/Shanghai",
  "totalFetched": 10,
  "notes": "抓取人工智能相关新闻"
}
```

| 字段 | 是否必填 | 含义 | 示例 |
|---|---|---|---|
| `keyword` | 必填 | 本次抓取关键词 | `"人工智能"`、`"人工智能教育"` |
| `category` | 必填 | 本次数据所属栏目 | `"人工智能"`、`"科技数码"` |
| `timeRange` | 必填 | 抓取时间范围 | `"24h"`、`"7d"`、`"30d"` |
| `crawledAt` | 必填 | 抓取完成时间 | `"2026-07-18T08:00:00+08:00"` |
| `timezone` | 必填 | 抓取所用时区 | `"Asia/Shanghai"` |
| `totalFetched` | 必填 | 本次抓取到的新闻数量 | `10` |
| `notes` | 可选 | 备注 | `"API 返回结果已去除广告"` |

`timeRange` 建议只使用以下值：

```text
24h
7d
30d
custom
```

时间格式要求：

- 使用 ISO 8601 时间字符串。
- 建议带时区，例如：

```text
2026-07-18T08:00:00+08:00
```

## 5. `articles` 字段说明

`articles` 是新闻数组，也是后端最重要的数据入口。

示例：

```json
"articles": [
  {
    "id": "example-source-20260718-001",
    "title": "示例新闻标题",
    "description": "新闻摘要",
    "content": "新闻正文或正文片段",
    "source": "示例媒体",
    "sourceUrl": "https://example.com/news/example-article",
    "publishedAt": "2026-07-18T07:30:00+08:00",
    "category": "人工智能",
    "imageUrl": "https://example.com/images/example.jpg",
    "keywords": ["人工智能", "科技"],
    "raw": {}
  }
]
```

每一篇新闻都应该尽量填写完整。P0 必填字段如下：

```text
id
title
description
source
publishedAt
category
keywords
```

## 6. 单篇新闻字段说明

### 6.1 `id`

新闻唯一 ID。

示例：

```json
"id": "example-source-20260718-001"
```

填写规则：

- 同一篇新闻每次出现时，`id` 应尽量保持一致。
- 如果新闻 API 提供原始 ID，优先使用原始 ID。
- 如果没有原始 ID，可以用来源、日期和序号拼接。

建议格式：

```text
来源-日期-序号
```

例如：

```text
36kr-20260718-001
people-20260718-002
```

### 6.2 `title`

新闻标题。

示例：

```json
"title": "某公司发布新一代 AI 助手"
```

填写规则：

- 保留新闻原意。
- 可以去除多余空格、乱码和无意义前缀。
- 不要为了吸引眼球改写标题。

### 6.3 `description`

新闻摘要或简短描述。

示例：

```json
"description": "该公司发布了新一代 AI 助手，重点提升多模态理解和办公场景能力。"
```

填写规则：

- 优先使用源站提供的摘要。
- 如果源站没有摘要，可以从正文前 100 到 200 字截取。
- 不要编造原文没有的信息。
- 如果确实没有摘要，可填空字符串，但不推荐。

### 6.4 `content`

新闻正文或正文片段，可选。

示例：

```json
"content": "更长的新闻正文内容……"
```

用途：

- 帮助后端做摘要相似度去重。
- 帮助 AI 生成更准确的摘要。

填写规则：

- 有正文抓取能力就填写。
- 没有正文抓取能力可以删除该字段，或填空字符串。

### 6.5 `source`

新闻真实来源名称。

示例：

```json
"source": "36氪"
```

填写规则：

- 必须填写真实来源。
- 不要伪造媒体名。
- 如果无法识别来源，可填写 `"Unknown"`。

### 6.6 `sourceUrl`

新闻原文链接，可选但强烈建议填写。

示例：

```json
"sourceUrl": "https://example.com/news/example-article"
```

用途：

- 前端展示“查看原文”入口。
- 后端用于同源转载过滤和去重。

填写规则：

- 优先填写最终可访问的原文 URL。
- 如果 URL 带有追踪参数，可以尽量清理。
- 如果没有链接，可以删除该字段或填空字符串。

### 6.7 `publishedAt`

新闻发布时间。

示例：

```json
"publishedAt": "2026-07-18T07:30:00+08:00"
```

填写规则：

- 使用 ISO 8601 格式。
- 尽量保留原新闻的发布时间。
- 如果源站没有发布时间，可使用抓取时间，但需要在 `raw` 或 `notes` 中说明。

### 6.8 `category`

新闻所属分类。

示例：

```json
"category": "人工智能"
```

建议优先使用产品预设方向：

```text
人工智能
科技数码
商业财经
体育赛事
电影娱乐
校园生活
区块链
大学生就业
健康生活
```

说明：

- 日报会按 `category` 或用户订阅方向形成栏目。
- 如果不确定分类，可以填最接近的主题。

### 6.9 `imageUrl`

新闻主图链接，可选。

示例：

```json
"imageUrl": "https://example.com/images/example.jpg"
```

填写规则：

- 有新闻主图就填写。
- 图片 URL 应尽量可公开访问。
- 如果没有图片，可以删除该字段，后端会使用默认占位图。

### 6.10 `keywords`

关键词数组。

示例：

```json
"keywords": ["人工智能", "AI 助手", "科技"]
```

填写规则：

- 至少包含本次抓取关键词或分类词。
- 可以加入标题中的重要实体、公司名、技术名。
- 不要放太多无意义词。
- 推荐 2 到 6 个关键词。

### 6.11 `raw`

爬虫侧原始字段，可选。

示例：

```json
"raw": {
  "originalId": "optional-original-id",
  "originalTitle": "源站原始标题",
  "author": "作者名",
  "language": "zh-CN"
}
```

用途：

- 保留调试信息。
- 方便排查字段转换问题。
- 前端不会直接依赖这个字段。

填写规则：

- 可放原始 ID、作者、语言、原始标题等。
- 不要放 API Key、Cookie、Token 或个人敏感信息。

## 7. `_schema` 字段说明

`_schema` 是模板内置的字段说明区。

作用：

- 告诉成员哪些字段必填。
- 说明字段怎么填。
- 记录允许值。

真实交付数据中：

- 可以保留 `_schema`，方便阅读。
- 也可以删除 `_schema`，减少文件体积。
- 后端读取数据时只依赖 `articles`，不会依赖 `_schema`。

## 8. 最小可用示例

如果觉得完整模板太长，成员提交数据时至少保证以下结构：

```json
{
  "schemaVersion": "1.0.0",
  "batchId": "news-batch-2026-07-18-ai-001",
  "provider": {
    "name": "crawler-member-name",
    "sourceType": "website",
    "sourceName": "示例媒体"
  },
  "crawl": {
    "keyword": "人工智能",
    "category": "人工智能",
    "timeRange": "24h",
    "crawledAt": "2026-07-18T08:00:00+08:00",
    "timezone": "Asia/Shanghai",
    "totalFetched": 1
  },
  "articles": [
    {
      "id": "example-20260718-001",
      "title": "示例新闻标题",
      "description": "示例新闻摘要",
      "source": "示例媒体",
      "sourceUrl": "https://example.com/news/1",
      "publishedAt": "2026-07-18T07:30:00+08:00",
      "category": "人工智能",
      "keywords": ["人工智能"]
    }
  ]
}
```

## 9. 交付前检查清单

- [ ] JSON 可以被正常解析，没有注释、尾逗号或非法引号。
- [ ] `articles` 是数组，且至少包含 1 条新闻。
- [ ] 每条新闻都有 `id`、`title`、`description`、`source`、`publishedAt`、`category`、`keywords`。
- [ ] `publishedAt` 和 `crawledAt` 使用 ISO 8601 时间格式。
- [ ] `source` 和 `sourceUrl` 不伪造。
- [ ] `keywords` 是字符串数组。
- [ ] 文件中没有 API Key、Cookie、Token、真实私人邮箱等敏感信息。
- [ ] 如果缺少图片，允许不填 `imageUrl`。
- [ ] 如果缺少正文，允许不填 `content`。

## 10. 建议文件命名

建议将不同抓取结果放到 `data/raw/` 或 `data/demo/` 下。

命名示例：

```text
data/raw/news-ai-2026-07-18.json
data/raw/news-business-2026-07-18.json
data/raw/news-ai-education-2026-07-18.json
data/demo/theme-ai-news.json
data/demo/topic-ai-education-news.json
```

命名规则：

```text
news-主题-日期.json
```

这样后端和前端联调时更容易找到对应数据。
