import { databaseEnabled } from "@/lib/env";
import { getSupabaseServerClient, toCamelDate } from "@/lib/db/supabase";
import type { Creation, CreationType, ThemePosterContent, TopicPosterContent } from "@/types";

interface CreationRow {
  id: string;
  type: CreationType;
  title: string;
  description: string;
  cover_image_url: string;
  created_at: string;
  href: string;
  saved: boolean;
}

interface PosterRow {
  id: string;
  kind: "theme" | "topic";
  content: ThemePosterContent | TopicPosterContent;
}

export async function savePosterToDb(
  poster: ThemePosterContent | TopicPosterContent,
  kind: "theme" | "topic"
) {
  if (!databaseEnabled()) return null;

  const { error } = await getSupabaseServerClient().from("topic_posters").upsert({
    id: poster.id,
    user_id: "user_01",
    kind,
    content: poster,
    created_at: poster.createdAt
  });

  if (error) throw error;
  return poster;
}

export async function getThemePosterFromDb(id: string) {
  return getPosterFromDb<ThemePosterContent>(id, "theme");
}

export async function getTopicPosterFromDb(id: string) {
  return getPosterFromDb<TopicPosterContent>(id, "topic");
}

export async function upsertCreationToDb(creation: Creation) {
  if (!databaseEnabled()) return null;

  const { data, error } = await getSupabaseServerClient()
    .from("creations")
    .upsert(
      {
        id: creation.id,
        user_id: "user_01",
        type: creation.type,
        title: creation.title,
        description: creation.description,
        cover_image_url: creation.coverImageUrl,
        href: creation.href,
        saved: creation.saved,
        created_at: creation.createdAt
      },
      { onConflict: "href" }
    )
    .select("*")
    .single();

  if (error) throw error;
  return rowToCreation(data as CreationRow);
}

export async function listCreationsFromDb() {
  if (!databaseEnabled()) return null;

  const { data, error } = await getSupabaseServerClient()
    .from("creations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as CreationRow[]).map(rowToCreation);
}

export async function saveCreationByHrefToDb(href: string) {
  if (!databaseEnabled()) return null;

  const { data: existing, error: existingError } = await getSupabaseServerClient()
    .from("creations")
    .select("*")
    .eq("href", href)
    .maybeSingle();
  if (existingError) throw existingError;
  if (!existing) return null;

  const { data, error } = await getSupabaseServerClient()
    .from("creations")
    .update({ saved: true })
    .eq("href", href)
    .select("*")
    .single();

  if (error) throw error;
  return rowToCreation(data as CreationRow);
}

async function getPosterFromDb<T>(id: string, kind: "theme" | "topic") {
  if (!databaseEnabled()) return null;

  const { data, error } = await getSupabaseServerClient()
    .from("topic_posters")
    .select("*")
    .eq("id", id)
    .eq("kind", kind)
    .maybeSingle();

  if (error) throw error;
  const row = data as PosterRow | null;
  return (row?.content as T | undefined) ?? null;
}

function rowToCreation(row: CreationRow): Creation {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    createdAt: toCamelDate(row.created_at),
    href: row.href,
    saved: row.saved
  };
}
