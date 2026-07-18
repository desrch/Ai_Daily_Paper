#!/bin/bash
# 将本地 .env.local 中的关键变量同步到 Vercel 项目
# 用法：bash scripts/sync-env-to-vercel.sh [production|preview]

ENV=${1:-production}

declare -a VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "DATABASE_ENABLED"
  "DEEPSEEK_API_KEY"
  "DEEPSEEK_BASE_URL"
  "DEEPSEEK_MODEL"
  "AI_ENABLED"
  "NEWS_PROVIDER_MODE"
  "NEXT_PUBLIC_APP_URL"
  "NEXT_PUBLIC_USE_MOCK_API"
  "DEMO_USER_ID"
)

for key in "${VARS[@]}"; do
  value=$(grep "^${key}=" .env.local | sed "s/^${key}=//" | head -n 1)
  if [ -z "$value" ]; then
    echo "Skipping empty $key"
    continue
  fi
  printf '%s' "$value" | npx vercel@latest env add "$key" "$ENV"
done
