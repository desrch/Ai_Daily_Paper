import type { ApiError } from "@/types";

export class TodayPaperApiError extends Error implements ApiError {
  readonly code: string;
  readonly retryable: boolean;

  constructor(error: ApiError) {
    super(error.message);
    this.name = "TodayPaperApiError";
    this.code = error.code;
    this.retryable = error.retryable;
  }
}

export function toApiError(error: unknown): TodayPaperApiError {
  if (error instanceof TodayPaperApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new TodayPaperApiError({
      code: "UNEXPECTED_ERROR",
      message: error.message,
      retryable: false,
    });
  }

  return new TodayPaperApiError({
    code: "UNEXPECTED_ERROR",
    message: "发生未知错误，请稍后重试。",
    retryable: false,
  });
}
