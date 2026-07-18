import OpenAI from "openai";
import { aiEnabled, deepseekConfig } from "@/lib/env";

let cachedClient: OpenAI | null = null;

export function getDeepSeekClient() {
  const config = deepseekConfig();
  if (!config.apiKey) throw new Error("DEEPSEEK_API_KEY is not configured.");

  if (!cachedClient) {
    cachedClient = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL
    });
  }

  return cachedClient;
}

export async function createJsonCompletion<T>(prompt: string): Promise<T | null> {
  if (!aiEnabled()) return null;

  const config = deepseekConfig();
  const completion = await getDeepSeekClient().chat.completions.create({
    model: config.model,
    messages: [
      {
        role: "system",
        content:
          "你是 TodayPaper 的中文新闻编辑。你只能基于用户提供的新闻 JSON 写结构化内容，不得编造来源、时间、链接或事实。只输出合法 JSON。"
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.2
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) return null;

  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}
