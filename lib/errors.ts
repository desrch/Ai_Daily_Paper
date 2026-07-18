import type { BackendApiError, ErrorCode } from "@/types/backend";

/**
 * 后端领域错误。携带 code、retryable 与可选 requestId。
 * 不在 message 中放入密钥、Cookie 或完整原文。
 */
export class BackendError extends Error implements BackendApiError {
  readonly code: string;
  readonly retryable: boolean;
  readonly requestId?: string;

  constructor(
    error: { code: ErrorCode | string; message: string; retryable?: boolean },
    requestId?: string,
  ) {
    super(error.message);
    this.name = "BackendError";
    this.code = error.code;
    this.retryable = error.retryable ?? false;
    this.requestId = requestId;
  }

  toApiError(requestId?: string): BackendApiError {
    return {
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      requestId: this.requestId ?? requestId,
    };
  }
}
