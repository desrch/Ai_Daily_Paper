import { createJsonCompletion } from "@/lib/ai/client";
import { dailyAiSchema, themePosterAiSchema, topicPosterAiSchema } from "@/lib/ai/schemas";
import type { DailyIssue, NewsArticle, ThemePosterContent, TopicPosterContent } from "@/types";

export async function enhanceDailyIssueWithAi(issue: DailyIssue) {
  const articles = issue.sections.flatMap((section) =>
    section.articles.map((article) => ({
      id: article.id,
      title: article.title,
      description: article.description,
      source: article.source,
      publishedAt: article.publishedAt,
      category: article.category
    }))
  );

  const prompt = [
    "请基于以下新闻，为个人日报生成结构化中文内容。",
    "只输出 JSON，字段为 dailyBriefing、quickNews、watchNext。",
    "quickNews 是 3-6 条一句话新闻；watchNext 是 2-4 条保守的后续关注点。",
    "不得添加新闻中没有的事实。",
    JSON.stringify({ topics: issue.topics, articles }, null, 2)
  ].join("\n\n");

  const output = await safeAi(prompt, dailyAiSchema);
  if (!output) return issue;

  return {
    ...issue,
    dailyBriefing: output.dailyBriefing,
    quickNews: output.quickNews,
    watchNext: output.watchNext
  };
}

export async function enhanceThemePosterWithAi(poster: ThemePosterContent) {
  const prompt = [
    "请基于以下新闻，为主题海报生成结构化中文内容。",
    "只输出 JSON，字段为 introduction、trendSummary、keywords。",
    "keywords 返回 3-6 个核心关键词。",
    "不得修改新闻来源、发布时间或链接，不得添加新闻中没有的事实。",
    JSON.stringify({ theme: poster.theme, articles: slimArticles(poster.articles) }, null, 2)
  ].join("\n\n");

  const output = await safeAi(prompt, themePosterAiSchema);
  if (!output) return poster;

  return {
    ...poster,
    introduction: output.introduction,
    trendSummary: output.trendSummary,
    keywords: output.keywords
  };
}

export async function enhanceTopicPosterWithAi(poster: TopicPosterContent) {
  const prompt = [
    "请基于以下专题新闻，生成结构化中文内容。",
    "只输出 JSON，字段为 introduction、trendSummary、keyTakeaways、keywords、articleSummaries。",
    "articleSummaries 中每项必须保留原始 id，只能输出 headline 和 summary，不得修改来源、发布时间、链接。",
    "不得添加新闻中没有的事实。",
    JSON.stringify(
      {
        keyword: poster.keyword,
        articles: poster.articles.map((article) => ({
          id: article.id,
          headline: article.headline,
          summary: article.summary,
          angle: article.angle,
          source: article.source,
          publishedAt: article.publishedAt
        }))
      },
      null,
      2
    )
  ].join("\n\n");

  const output = await safeAi(prompt, topicPosterAiSchema);
  if (!output) return poster;

  const byId = new Map(output.articleSummaries.map((article) => [article.id, article]));
  return {
    ...poster,
    introduction: output.introduction,
    trendSummary: output.trendSummary,
    keyTakeaways: output.keyTakeaways,
    keywords: output.keywords,
    articles: poster.articles.map((article) => {
      const generated = byId.get(article.id);
      if (!generated) return article;
      return {
        ...article,
        headline: generated.headline,
        summary: generated.summary
      };
    })
  };
}

async function safeAi<T>(prompt: string, schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false } }) {
  try {
    const raw = await createJsonCompletion<unknown>(prompt);
    const parsed = schema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function slimArticles(articles: NewsArticle[]) {
  return articles.map((article) => ({
    id: article.id,
    title: article.title,
    description: article.description,
    source: article.source,
    publishedAt: article.publishedAt,
    category: article.category,
    keywords: article.keywords
  }));
}
