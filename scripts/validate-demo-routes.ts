import { readFile } from "node:fs/promises";
import path from "node:path";

import dailyIssueJson from "@/data/demo/daily-issue.json";
import subscriptionsJson from "@/data/demo/subscriptions.json";
import themePosterJson from "@/data/demo/theme-poster.json";
import topicPosterJson from "@/data/demo/topic-poster.json";
import {
  dailyIssueSchema,
  subscriptionBundleSchema,
  themePosterContentSchema,
  topicPosterContentSchema,
} from "@/lib/api/schemas";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const routeFiles = [
  "app/demo/home/page.tsx",
  "app/demo/newspaper/page.tsx",
  "app/demo/theme-poster/page.tsx",
  "app/demo/topic-poster/page.tsx",
] as const;

const forbiddenPatterns = [
  "apiClient",
  "fetch(",
  "localStorage",
  "readMockStore",
  "NEXT_PUBLIC_",
] as const;

async function main() {
  const issue = dailyIssueSchema.parse(dailyIssueJson);
  const subscriptions =
    subscriptionBundleSchema.parse(subscriptionsJson);
  const themePoster =
    themePosterContentSchema.parse(themePosterJson);
  const topicPoster =
    topicPosterContentSchema.parse(topicPosterJson);

  assert(issue.id === "demo-daily", "固定演示日报 ID 不正确");
  assert(
    subscriptions.subscriptions.length >= 3,
    "固定演示订阅不足 3 个",
  );
  assert(
    themePoster.id === "demo-theme",
    "固定主题海报 ID 不正确",
  );
  assert(
    topicPoster.id === "demo-topic",
    "固定专题海报 ID 不正确",
  );

  for (const routeFile of routeFiles) {
    const source = await readFile(
      path.join(process.cwd(), routeFile),
      "utf8",
    );

    assert(
      source.includes("@/data/demo/"),
      `${routeFile} 未直接读取固定演示数据`,
    );

    for (const pattern of forbiddenPatterns) {
      assert(
        !source.includes(pattern),
        `${routeFile} 不应依赖 ${pattern}`,
      );
    }
  }

  console.log(
    "固定演示路由校验通过：4 个页面直接读取本地 JSON，未引用 API、fetch 或 localStorage。",
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
