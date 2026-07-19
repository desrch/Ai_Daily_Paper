import { apiError, json, normalizeString } from "@/lib/api/http";
import { isExternalNewsEnabled, searchNewsExternal } from "@/lib/news/external-source";
import { searchNews } from "@/lib/news/source";
import type { SearchNewsResponse, TimeRange } from "@/types";

const TIME_RANGES = new Set(["24h", "7d", "30d"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = normalizeString(searchParams.get("keyword"));
  const rawTimeRange = normalizeString(searchParams.get("timeRange")) || "7d";

  if (!keyword || keyword.length > 50) {
    return apiError(400, "INVALID_INPUT", "请输入 1 到 50 个字符的搜索关键词。", false);
  }

  if (!TIME_RANGES.has(rawTimeRange)) {
    return apiError(400, "INVALID_TIME_RANGE", "时间范围只支持 24h、7d 或 30d。", false);
  }

  const timeRange = rawTimeRange as TimeRange;
  const externalItems = isExternalNewsEnabled()
    ? await searchNewsExternal(keyword, timeRange)
    : [];
  const items = externalItems.length > 0 ? externalItems : searchNews(keyword, timeRange);
  const response: SearchNewsResponse = {
    query: keyword,
    timeRange,
    items,
    total: items.length
  };

  return json(response);
}
