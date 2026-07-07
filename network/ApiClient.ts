import { ErrorMapper } from './ErrorMapper';
import { NetworkManager } from './NetworkManager';
import { RequestQueue } from './RequestQueue';
import { RequestDeduplicator } from './RequestDeduplicator';
import { NoopNetworkLogger } from './logger';
import {
  ApiError,
  ApiRequestConfig,
  ApiResponse,
  AuthProvider,
  HttpTransport,
  NetworkLogger,
  RequestInterceptor,
  ResponseInterceptor,
  RetryPolicy,
} from './types';

const DEFAULT_RETRY: RetryPolicy = {
  retries: 2,
  baseDelayMs: 350,
  maxDelayMs: 4_000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface ApiClientOptions {
  baseUrl: string;
  transport: HttpTransport;
  networkManager: NetworkManager;
  requestQueue?: RequestQueue;
  errorMapper?: ErrorMapper;
  authProvider?: AuthProvider;
  logger?: NetworkLogger;
  defaultTimeoutMs?: number;
  defaultRetryPolicy?: Partial<RetryPolicy>;
  requestInterceptors?: RequestInterceptor[];
  responseInterceptors?: ResponseInterceptor[];
}

export class ApiClient {
  private readonly requestInterceptors: RequestInterceptor[] = [];
  private readonly responseInterceptors: ResponseInterceptor[] = [];
  private readonly errorMapper: ErrorMapper;
  private readonly logger: NetworkLogger;
  private readonly retryPolicy: RetryPolicy;
  private readonly timeoutMs: number;
  private readonly deduplicator = new RequestDeduplicator();

  constructor(private readonly options: ApiClientOptions) {
    this.errorMapper = options.errorMapper ?? new ErrorMapper();
    this.logger = options.logger ?? new NoopNetworkLogger();
    this.retryPolicy = { ...DEFAULT_RETRY, ...options.defaultRetryPolicy };
    this.timeoutMs = options.defaultTimeoutMs ?? 12_000;
    this.requestInterceptors.push(...(options.requestInterceptors ?? []));
    this.responseInterceptors.push(...(options.responseInterceptors ?? []));
  }

  addRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptors.push(interceptor);
  }

  request<T>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    const dedupeKey = this.getDeduplicationKey(config);
    if (dedupeKey) return this.deduplicator.run(dedupeKey, () => this.requestWithoutDeduplication<T>(config));
    return this.requestWithoutDeduplication<T>(config);
  }

  private requestWithoutDeduplication<T>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    if (config.background && this.options.requestQueue) {
      return this.options.requestQueue.add(() => this.executeWithRetry<T>(config), {
        id: config.id,
        priority: config.priority,
        background: true,
      });
    }
    return this.executeWithRetry<T>(config);
  }

  private getDeduplicationKey(config: ApiRequestConfig) {
    if (config.metadata?.dedupe === false) return undefined;
    if (config.signal) return undefined;
    if (config.method !== 'GET') return undefined;
    return JSON.stringify({ method: config.method, baseUrl: config.baseUrl ?? this.options.baseUrl, url: config.url, query: config.query, auth: Boolean(config.requiresAuth) });
  }

  cancelController() {
    return new AbortController();
  }

  private async executeWithRetry<T>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    const policy = { ...this.retryPolicy, ...config.retryPolicy };
    let lastError: ApiError | undefined;

    for (let attempt = 0; attempt <= policy.retries; attempt += 1) {
      try {
        if (!this.options.networkManager.isOnline()) {
          throw this.errorMapper.fromUnknown(new Error('Offline'), { kind: 'offline', retryable: true, url: config.url, requestId: config.id });
        }

        return await this.executeOnce<T>(config, attempt);
      } catch (error) {
        const mapped = this.errorMapper.fromUnknown(error, { url: config.url, requestId: config.id });
        lastError = mapped;

        if (mapped.status === 401 && config.requiresAuth && this.options.authProvider?.refreshAuth && attempt === 0) {
          this.logger.warn('Refreshing authentication after unauthorized response', { url: config.url });
          await this.options.authProvider.refreshAuth();
          continue;
        }

        const retryableStatus = mapped.status ? policy.retryableStatusCodes.includes(mapped.status) : mapped.retryable;
        if (attempt >= policy.retries || !retryableStatus || mapped.kind === 'cancelled') break;

        const delay = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** attempt);
        this.logger.warn('Retrying request', { url: config.url, attempt: attempt + 1, delay, kind: mapped.kind, status: mapped.status });
        await wait(delay);
      }
    }

    throw lastError ?? this.errorMapper.fromUnknown(new Error('Request failed'), { url: config.url, requestId: config.id });
  }

  private async executeOnce<T>(config: ApiRequestConfig, attempt: number): Promise<ApiResponse<T>> {
    const startedAt = Date.now();
    const requestId = config.id ?? `req-${startedAt}-${Math.random().toString(36).slice(2)}`;
    let request: ApiRequestConfig = { ...config, id: requestId };

    for (const interceptor of this.requestInterceptors) request = await interceptor(request);

    const url = this.buildUrl(request);
    const headers: Record<string, string> = { accept: 'application/json', ...(request.headers ?? {}) };
    if (request.requiresAuth && this.options.authProvider) Object.assign(headers, await this.options.authProvider.getAuthHeaders());

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), request.timeoutMs ?? this.timeoutMs);
    const cancelForwarder = () => controller.abort();
    request.signal?.addEventListener('abort', cancelForwarder, { once: true });

    try {
      this.logger.debug('Sending request', { requestId, method: request.method, url, attempt });
      const response = await this.options.transport.send<T>({
        method: request.method,
        url,
        headers,
        body: request.body,
        signal: controller.signal,
      });

      let apiResponse: ApiResponse<T> = {
        ...response,
        requestId,
        durationMs: Date.now() - startedAt,
      };

      for (const interceptor of this.responseInterceptors) apiResponse = await interceptor(apiResponse) as ApiResponse<T>;

      if (!apiResponse.ok) throw this.errorMapper.fromResponse(apiResponse as ApiResponse<unknown>);
      this.logger.info('Request completed', { requestId, status: apiResponse.status, durationMs: apiResponse.durationMs });
      return apiResponse;
    } catch (error) {
      const kind: 'timeout' | 'cancelled' | undefined = controller.signal.aborted && !request.signal?.aborted ? 'timeout' : request.signal?.aborted ? 'cancelled' : undefined;
      throw this.errorMapper.fromUnknown(error, { kind, url, requestId });
    } finally {
      clearTimeout(timeout);
      request.signal?.removeEventListener('abort', cancelForwarder);
    }
  }

  private buildUrl(request: ApiRequestConfig) {
    const base = request.baseUrl ?? this.options.baseUrl;
    const url = new URL(request.url, base);
    Object.entries(request.query ?? {}).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, String(value));
    });
    return url.toString();
  }
}
