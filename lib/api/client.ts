import type { TodayPaperApiClient } from "@/lib/api/contracts";
import { createHttpClient } from "@/lib/api/http-client";
import { createMockClient } from "@/lib/api/mock-client";

const useMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API !== "false";

export const apiClient: TodayPaperApiClient = useMockApi
  ? createMockClient()
  : createHttpClient({
      baseUrl: process.env.NEXT_PUBLIC_APP_URL,
    });

export type { TodayPaperApiClient } from "@/lib/api/contracts";
export { TodayPaperApiError, toApiError } from "@/lib/api/errors";
export { createHttpClient } from "@/lib/api/http-client";
export { createMockClient } from "@/lib/api/mock-client";
