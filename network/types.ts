export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type RequestPriority = 'low' | 'normal' | 'high';
export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'cancelled' | 'offline' | 'rate_limited' | 'unknown';

export interface RetryPolicy {
  retries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableStatusCodes: number[];
}

export interface RateLimitPolicy {
  maxRequests: number;
  perMilliseconds: number;
}

export interface ApiRequestConfig<TBody = unknown> {
  id?: string;
  method: HttpMethod;
  url: string;
  baseUrl?: string;
  headers?: Record<string, string>;
  body?: TBody;
  query?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
  signal?: AbortSignal;
  retryPolicy?: Partial<RetryPolicy>;
  requiresAuth?: boolean;
  background?: boolean;
  priority?: RequestPriority;
  metadata?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  status: number;
  ok: boolean;
  url: string;
  headers: Record<string, string>;
  data: T;
  requestId: string;
  durationMs: number;
}

export interface ApiErrorDetails {
  kind: ApiErrorKind;
  message: string;
  status?: number;
  code?: string;
  url?: string;
  requestId?: string;
  retryable: boolean;
  cause?: unknown;
}

export class ApiError extends Error implements ApiErrorDetails {
  kind: ApiErrorKind;
  status?: number;
  code?: string;
  url?: string;
  requestId?: string;
  retryable: boolean;
  cause?: unknown;

  constructor(details: ApiErrorDetails) {
    super(details.message);
    this.name = 'ApiError';
    this.kind = details.kind;
    this.status = details.status;
    this.code = details.code;
    this.url = details.url;
    this.requestId = details.requestId;
    this.retryable = details.retryable;
    this.cause = details.cause;
  }
}

export type RequestInterceptor = (request: ApiRequestConfig) => Promise<ApiRequestConfig> | ApiRequestConfig;
export type ResponseInterceptor = <T>(response: ApiResponse<T>) => Promise<ApiResponse<T>> | ApiResponse<T>;

export interface HttpTransportRequest {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
}

export interface HttpTransportResponse<T = unknown> {
  status: number;
  ok: boolean;
  url: string;
  headers: Record<string, string>;
  data: T;
}

export interface HttpTransport {
  send<T>(request: HttpTransportRequest): Promise<HttpTransportResponse<T>>;
}

export interface AuthProvider {
  getAuthHeaders(): Promise<Record<string, string>>;
  refreshAuth?(): Promise<void>;
}

export interface NetworkLogger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export interface ConnectivityProvider {
  isOnline(): Promise<boolean>;
  subscribe(listener: (online: boolean) => void): () => void;
}
