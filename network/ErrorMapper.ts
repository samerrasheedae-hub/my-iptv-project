import { ApiError, ApiErrorDetails, ApiErrorKind, ApiResponse } from './types';

export class ErrorMapper {
  fromResponse(response: ApiResponse<unknown>): ApiError {
    return new ApiError({
      kind: response.status === 429 ? 'rate_limited' : 'http',
      message: `Request failed with status ${response.status}`,
      status: response.status,
      url: response.url,
      requestId: response.requestId,
      retryable: response.status === 408 || response.status === 429 || response.status >= 500,
    });
  }

  fromUnknown(error: unknown, context: Partial<ApiErrorDetails> = {}): ApiError {
    if (error instanceof ApiError) return error;

    const name = typeof error === 'object' && error && 'name' in error ? String((error as { name?: string }).name) : '';
    const rawMessage = error instanceof Error ? error.message : 'Unknown network error';
    const inferredKind = this.inferKind(name, rawMessage, context.kind);

    return new ApiError({
      kind: inferredKind,
      message: context.message ?? this.messageFor(inferredKind, rawMessage),
      status: context.status,
      code: context.code,
      url: context.url,
      requestId: context.requestId,
      retryable: context.retryable ?? this.isRetryable(inferredKind),
      cause: context.cause ?? error,
    });
  }

  private inferKind(name: string, message: string, explicit?: ApiErrorKind): ApiErrorKind {
    if (explicit) return explicit;
    if (name === 'AbortError') return 'cancelled';
    if (message.toLowerCase().includes('timeout')) return 'timeout';
    return 'network';
  }

  private messageFor(kind: ApiErrorKind, fallback: string) {
    switch (kind) {
      case 'cancelled': return 'Request was cancelled';
      case 'timeout': return 'Request timed out';
      case 'offline': return 'Device is offline';
      case 'rate_limited': return 'Too many requests';
      default: return fallback;
    }
  }

  private isRetryable(kind: ApiErrorKind) {
    return kind === 'network' || kind === 'timeout' || kind === 'offline' || kind === 'rate_limited';
  }
}
