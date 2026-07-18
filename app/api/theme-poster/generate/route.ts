import { apiError, json, readJsonBody } from "@/lib/api/http";
import { enhanceThemePosterWithAi } from "@/lib/ai/generate";
import { savePosterToDb, upsertCreationToDb } from "@/lib/db/creations";
import { generateThemePoster, themePosterCreation } from "@/lib/demo/generate";
import type { PosterTemplate, SummaryLength } from "@/types";

interface GenerateThemePosterRequest {
  theme?: string;
  articleCount?: number;
  summaryLength?: SummaryLength;
  template?: PosterTemplate;
}

const TEMPLATES = new Set(["classic", "modern"]);
const SUMMARY_LENGTHS = new Set(["brief", "standard"]);

export async function POST(request: Request) {
  const body = await readJsonBody<GenerateThemePosterRequest>(request);
  if (!body) {
    return apiError(400, "INVALID_JSON", "请求体必须是合法 JSON。", false);
  }

  const theme = typeof body.theme === "string" ? body.theme.trim() : "";
  const template = body.template ?? "classic";
  const summaryLength = body.summaryLength ?? "standard";

  if (!theme || theme.length > 50) {
    return apiError(400, "INVALID_THEME", "请输入 1 到 50 个字符的主题。", false);
  }
  if (!TEMPLATES.has(template)) {
    return apiError(400, "INVALID_TEMPLATE", "海报模板只支持 classic 或 modern。", false);
  }
  if (!SUMMARY_LENGTHS.has(summaryLength)) {
    return apiError(400, "INVALID_SUMMARY_LENGTH", "摘要长度只支持 brief 或 standard。", false);
  }

  const fallbackPoster = generateThemePoster(theme, body.articleCount ?? 4, template);
  const poster = await enhanceThemePosterWithAi(fallbackPoster);

  try {
    await savePosterToDb(poster, "theme");
    await upsertCreationToDb(themePosterCreation(poster, false));
  } catch {
    // Keep generation usable without database persistence.
  }

  return json(poster);
}
