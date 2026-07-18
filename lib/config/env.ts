import { z } from "zod";

/**
 * 服务端环境变量解析。只判断存在性，不打印任何值。
 * 前端 .env.example 已使用 LLM_* / NEWS_API_KEY 命名，此处统一沿用，不引入第二套。
 */

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /** AI */
  LLM_API_KEY: z.string().optional(),
  LLM_BASE_URL: z.string().url().optional(),
  LLM_MODEL: z.string().optional(),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(12000),
  /** 是否强制使用 Mock AI。 */
  USE_MOCK_AI: z
    .string()
    .optional()
    .transform((value) => value !== "false"),
  /** 新闻源 */
  NEWS_API_KEY: z.string().optional(),
  /** Supabase */
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  /** 演示用户 ID。 */
  DEMO_USER_ID: z.string().default("demo-user"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function parseEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (parsed.success) {
    return parsed.data;
  }
  // 环境变量格式异常不阻塞启动，回退到默认。
  return serverEnvSchema.parse({
    NODE_ENV: process.env.NODE_ENV ?? "development",
  });
}

export const serverEnv = parseEnv();

/** 仅判断 AI 密钥是否存在，不暴露值。 */
export function hasLlmKey(): boolean {
  return Boolean(serverEnv.LLM_API_KEY && serverEnv.LLM_API_KEY.length > 0);
}

/** 仅判断新闻源密钥是否存在。 */
export function hasNewsApiKey(): boolean {
  return Boolean(serverEnv.NEWS_API_KEY && serverEnv.NEWS_API_KEY.length > 0);
}

/** 是否应使用 Mock AI：无密钥或显式 USE_MOCK_AI 时为 true。 */
export function shouldUseMockAi(): boolean {
  if (!hasLlmKey()) {
    return true;
  }
  return serverEnv.USE_MOCK_AI;
}
