import { json } from "@/lib/api/http";
import { getTopicPosterFromDb } from "@/lib/db/creations";
import { ensureSeedData } from "@/lib/demo/generate";
import { store } from "@/lib/demo/store";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  ensureSeedData();
  const { id } = await params;
  try {
    const dbPoster = await getTopicPosterFromDb(id);
    if (dbPoster) return json(dbPoster);
  } catch {
    // Fall through to in-memory demo data.
  }
  return json(store.topicPosters.get(id) ?? null);
}
