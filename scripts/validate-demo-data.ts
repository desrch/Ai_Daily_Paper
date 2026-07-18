import { existsSync } from "node:fs";
import { resolve } from "node:path";

import creationsJson from "@/data/demo/creations.json";
import dailyIssueJson from "@/data/demo/daily-issue.json";
import newsArticlesJson from "@/data/demo/news-articles.json";
import scenariosJson from "@/data/demo/scenarios.json";
import subscriptionsJson from "@/data/demo/subscriptions.json";
import themePosterJson from "@/data/demo/theme-poster.json";
import topicPosterJson from "@/data/demo/topic-poster.json";
import {
  creationSchema,
  dailyIssueSchema,
  demoScenariosSchema,
  searchNewsItemSchema,
  subscriptionBundleSchema,
  themePosterContentSchema,
  topicPosterContentSchema,
} from "@/lib/api/schemas";

const newsArticles = searchNewsItemSchema.array().parse(newsArticlesJson);
const dailyIssue = dailyIssueSchema.parse(dailyIssueJson);
const themePoster = themePosterContentSchema.parse(themePosterJson);
const topicPoster = topicPosterContentSchema.parse(topicPosterJson);
const creations = creationSchema.array().parse(creationsJson);

subscriptionBundleSchema.parse(subscriptionsJson);
demoScenariosSchema.parse(scenariosJson);

const knownArticleIds = new Set(newsArticles.map((article) => article.id));
const referencedArticleIds = [
  ...dailyIssue.sections.flatMap((section) =>
    section.articles.map((article) => article.id),
  ),
  ...themePoster.articles.map((article) => article.id),
  ...topicPoster.articles.map((article) => article.id),
];

const missingArticleIds = referencedArticleIds.filter(
  (id) => !knownArticleIds.has(id),
);

if (missingArticleIds.length > 0) {
  throw new Error(
    `演示内容引用了不存在的新闻：${Array.from(new Set(missingArticleIds)).join(", ")}`,
  );
}

const imagePaths = [
  ...newsArticles.flatMap((article) =>
    article.imageUrl ? [article.imageUrl] : [],
  ),
  ...creations.map((creation) => creation.coverImageUrl),
];

const missingImages = imagePaths.filter((imagePath) => {
  if (!imagePath.startsWith("/")) {
    return false;
  }

  return !existsSync(resolve(process.cwd(), "public", imagePath.slice(1)));
});

if (missingImages.length > 0) {
  throw new Error(
    `演示内容引用了不存在的本地图片：${Array.from(new Set(missingImages)).join(", ")}`,
  );
}

console.log(
  `演示数据校验通过：${newsArticles.length} 篇候选新闻、${dailyIssue.sections.length} 个日报栏目、${creations.length} 条历史作品。`,
);
