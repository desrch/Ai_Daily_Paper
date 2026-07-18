import { json } from "@/lib/api/http";
import { getThemePosterFromDb } from "@/lib/db/creations";
import { ensureSeedData } from "@/lib/demo/generate";
import { store } from "@/lib/demo/store";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  ensureSeedData();
  const { id } = await params;
  try {
    const dbPoster = await getThemePosterFromDb(id);
    if (dbPoster) return json(dbPoster);
  } catch {
    // Fall through to in-memory demo data.
  }
  return json(store.themePosters.get(id) ?? null);
}
