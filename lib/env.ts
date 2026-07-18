export function databaseEnabled() {
  return process.env.DATABASE_ENABLED !== "false" && hasSupabaseConfig();
}

export function aiEnabled() {
  return Boolean(resolveLlmConfig().apiKey);
}

export function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

export function requireSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  return value;
}

export function requireSupabaseServerKey() {
  const value =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!value) throw new Error("Supabase server key is not configured.");
  return value;
}

export function resolveLlmConfig() {
  return {
    apiKey:
      process.env.DEEPSEEK_API_KEY ||
      process.env.LLM_API_KEY,
    baseURL:
      process.env.DEEPSEEK_BASE_URL ||
      process.env.LLM_BASE_URL ||
      "https://api.deepseek.com",
    model:
      process.env.DEEPSEEK_MODEL ||
      process.env.LLM_MODEL ||
      "deepseek-v4-flash"
  };
}

/** @deprecated 请优先使用 resolveLlmConfig。 */
export function deepseekConfig() {
  return resolveLlmConfig();
}
