import type {
  Creation,
  DailyIssue,
  NewsArticle,
  PosterTemplate,
  SearchNewsItem,
  ThemePosterContent,
  TopicPosterContent
} from "@/types";
import { pickArticles } from "@/lib/news/source";
import { store, upsertCreation } from "@/lib/demo/store";

const CREATED_AT = "2026-07-18T01:30:00.000Z";

export function generateDailyIssue(userId: string, topics: string[], issueDate: string): DailyIssue {
  const id = `daily_${userId}_${issueDate}`.replace(/[^a-zA-Z0-9_]/g, "_");
  const existing = store.dailyIssues.get(id);
  if (existing) return existing;

  const normalizedTopics = topics.length ? topics : ["人工智能"];
  const sections = normalizedTopics.map((topic) => ({
    title: topic,
    articles: pickArticles(topic, 3, "7d").map(stripAngle)
  }));
  const allArticles = sections.flatMap((section) => section.articles);
  const lead = allArticles[0];

  const issue: DailyIssue = {
    id,
    userId,
    issueDate,
    newspaperName: "TodayPaper 今日报纸",
    topics: normalizedTopics,
    leadArticleId: lead.id,
    dailyBriefing: `今日围绕${normalizedTopics.join("、")}共筛选出 ${allArticles.length} 篇代表新闻，重点关注 AI 基础设施、技术治理和产业应用的最新进展。`,
    sections,
    quickNews: allArticles.slice(0, 5).map((article) => `${article.source}：${article.title}`),
    watchNext: [
      "继续观察人工智能治理规则与行业标准的落地进展。",
      "关注大模型、机器人和智能硬件在真实场景中的应用效果。",
      "留意科技企业和科研机构后续发布的产品、论文与合作计划。"
    ],
    createdAt: CREATED_AT
  };

  store.dailyIssues.set(issue.id, issue);
  upsertCreation(dailyIssueCreation(issue));
  return issue;
}

export function generateThemePoster(
  theme: string,
  articleCount: number,
  template: PosterTemplate
): ThemePosterContent {
  const count = clampArticleCount(articleCount);
  const id = `theme_${slug(theme)}_${count}_${template}`;
  const existing = store.themePosters.get(id);
  if (existing) return existing;

  const articles = pickArticles(theme, count, "7d").map(stripAngle);
  const poster: ThemePosterContent = {
    id,
    theme,
    title: `${theme} · 主题海报`,
    introduction: `本期主题聚焦“${theme}”，从近期待表新闻中提炼关键变化，帮助读者快速把握主要事件和发展方向。`,
    articles,
    trendSummary: `从已筛选新闻看，${theme}正在从单点技术热点走向标准建设、产业协作和场景落地并行推进的阶段。`,
    keywords: unique([theme, ...articles.flatMap((article) => article.keywords)]).slice(0, 6),
    template,
    createdAt: CREATED_AT
  };

  store.themePosters.set(poster.id, poster);
  upsertCreation(themePosterCreation(poster, false));
  return poster;
}

export function generateTopicPoster(
  keyword: string,
  articleIds: string[],
  articles: NewsArticle[],
  template: PosterTemplate
): TopicPosterContent {
  const id = `topic_${slug(keyword)}_${articleIds.join("_").slice(0, 40)}_${template}`;
  const existing = store.topicPosters.get(id);
  if (existing) return existing;

  const ordered = articles.length >= 3 ? articles : pickArticles(keyword, Math.max(articleIds.length, 4), "7d");
  const posterArticles = ordered.slice(0, 5).map((article) => {
    const item = article as SearchNewsItem;
    return {
      id: article.id,
      headline: compactTitle(article.title),
      summary: article.description,
      angle: item.angle ?? inferFallbackAngle(article),
      source: article.source,
      ...(article.sourceUrl ? { sourceUrl: article.sourceUrl } : {}),
      publishedAt: article.publishedAt,
      ...(article.imageUrl ? { imageUrl: article.imageUrl } : {}),
      relevanceScore: article.relevanceScore ?? 75
    };
  });

  const poster: TopicPosterContent = {
    id,
    keyword,
    topicTitle: `${keyword} · 专题海报`,
    introduction: `围绕“${keyword}”筛选多篇候选报道，按政策、技术、产业、应用和市场等角度整理主要信息。`,
    articles: posterArticles,
    trendSummary: `检索结果显示，“${keyword}”相关报道正在呈现多角度扩散：既有规则与标准讨论，也有产品、产业和应用场景推进。`,
    keyTakeaways: [
      "相关报道需要结合来源、时间和具体场景阅读，避免只看单一标题下结论。",
      "不同报道角度之间存在互补关系，适合整理为专题长海报。",
      "后续应继续关注政策标准、技术产品和真实应用反馈。"
    ],
    keywords: unique([keyword, ...posterArticles.flatMap((article) => [article.angle])]).slice(0, 6),
    template,
    createdAt: CREATED_AT
  };

  store.topicPosters.set(poster.id, poster);
  upsertCreation(topicPosterCreation(poster, false));
  return poster;
}

export function allCreations() {
  ensureSeedData();
  return Array.from(store.creations.values()).sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
}

export function ensureSeedData() {
  if (store.dailyIssues.size === 0) {
    generateDailyIssue("user_01", ["人工智能", "科技数码", "商业财经"], "2026-07-18");
  }
  if (store.themePosters.size === 0) {
    generateThemePoster("人工智能", 4, "classic");
  }
  if (store.topicPosters.size === 0) {
    const articles = pickArticles("人工智能教育", 4, "7d");
    generateTopicPoster(
      "人工智能教育",
      articles.map((article) => article.id),
      articles,
      "classic"
    );
  }
}

export function creationByHref(href: string): Creation | null {
  ensureSeedData();
  return Array.from(store.creations.values()).find((creation) => creation.href === href) ?? null;
}

export function dailyIssueCreation(issue: DailyIssue): Creation {
  return {
    id: `creation_${issue.id}`,
    type: "daily_issue",
    title: `${issue.issueDate} 今日报纸`,
    description: `${issue.topics.join("、")}个性化日报`,
    coverImageUrl: "/images/demo/cover-daily.svg",
    createdAt: issue.createdAt,
    href: `/newspaper/${issue.id}`,
    saved: true
  };
}

export function themePosterCreation(poster: ThemePosterContent, saved: boolean): Creation {
  return {
    id: `creation_${poster.id}`,
    type: "theme_poster",
    title: poster.title,
    description: `${poster.articles.length} 篇代表新闻的主题聚合`,
    coverImageUrl: "/images/demo/cover-theme.svg",
    createdAt: poster.createdAt,
    href: `/theme-poster/${poster.id}`,
    saved
  };
}

export function topicPosterCreation(poster: TopicPosterContent, saved: boolean): Creation {
  return {
    id: `creation_${poster.id}`,
    type: "topic_poster",
    title: poster.topicTitle,
    description: `${poster.articles.length} 篇多角度新闻专题`,
    coverImageUrl: "/images/demo/cover-topic.svg",
    createdAt: poster.createdAt,
    href: `/topic-poster/${poster.id}`,
    saved
  };
}

function stripAngle(article: SearchNewsItem | NewsArticle): NewsArticle {
  const { angle: _angle, ...rest } = article as SearchNewsItem;
  return rest;
}

function compactTitle(title: string) {
  return title.length > 28 ? `${title.slice(0, 28)}...` : title;
}

function inferFallbackAngle(article: NewsArticle): TopicPosterContent["articles"][number]["angle"] {
  const text = `${article.title} ${article.description}`;
  if (/政策|治理|标准|规则|监管/.test(text)) return "政策";
  if (/模型|算法|芯片|技术|研究|数据/.test(text)) return "技术";
  if (/产业|企业|商业|银行|公司/.test(text)) return "产业";
  if (/应用|教育|医疗|农业|机器人|助手/.test(text)) return "应用";
  return "市场";
}

function clampArticleCount(count: number) {
  if (!Number.isFinite(count)) return 4;
  return Math.max(3, Math.min(5, Math.round(count)));
}

function slug(value: string) {
  return encodeURIComponent(value.trim()).replace(/%/g, "").slice(0, 36) || "default";
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}
