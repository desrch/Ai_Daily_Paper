import { apiError, json, readJsonBody } from "@/lib/api/http";
import { saveCreationByHrefToDb } from "@/lib/db/creations";
import { creationByHref } from "@/lib/demo/generate";
import { store } from "@/lib/demo/store";

interface SaveCreationRequest {
  href?: string;
}

export async function POST(request: Request) {
  const body = await readJsonBody<SaveCreationRequest>(request);
  if (!body) {
    return apiError(400, "INVALID_JSON", "请求体必须是合法 JSON。", false);
  }

  const href = typeof body.href === "string" ? body.href.trim() : "";
  if (!href || !href.startsWith("/")) {
    return apiError(400, "INVALID_HREF", "href 必须是站内绝对路径。", false);
  }

  try {
    const dbSaved = await saveCreationByHrefToDb(href);
    if (dbSaved) return json(dbSaved);
  } catch {
    // Fall through to local demo state.
  }

  const existing = creationByHref(href);
  if (!existing) {
    return apiError(404, "CREATION_NOT_FOUND", "未找到要保存的作品。", false);
  }

  const saved = { ...existing, saved: true };
  store.creations.set(saved.id, saved);
  return json(saved);
}
