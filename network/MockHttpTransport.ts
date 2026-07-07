import { HttpTransport, HttpTransportRequest, HttpTransportResponse } from './types';

const wait = (ms: number, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
  const timer = setTimeout(resolve, ms);
  signal?.addEventListener('abort', () => {
    clearTimeout(timer);
    reject(Object.assign(new Error('Request aborted'), { name: 'AbortError' }));
  }, { once: true });
});

export class MockHttpTransport implements HttpTransport {
  async send<T>(request: HttpTransportRequest): Promise<HttpTransportResponse<T>> {
    await wait(220, request.signal);
    const url = new URL(request.url);

    if (url.pathname === '/mock/timeout') {
      await wait(10_000, request.signal);
    }

    if (url.pathname === '/mock/error') {
      return this.response(request.url, 500, { message: 'Mock server error' } as T);
    }

    if (url.pathname === '/mock/rate-limit') {
      return this.response(request.url, 429, { message: 'Mock rate limit' } as T);
    }

    if (url.pathname === '/mock/auth') {
      const authorized = Boolean(request.headers.Authorization);
      return this.response(request.url, authorized ? 200 : 401, { authorized } as T);
    }

    return this.response(request.url, 200, {
      ok: true,
      endpoint: url.pathname,
      method: request.method,
      receivedAt: new Date().toISOString(),
    } as T);
  }

  private response<T>(url: string, status: number, data: T): HttpTransportResponse<T> {
    return {
      status,
      ok: status >= 200 && status < 300,
      url,
      headers: { 'content-type': 'application/json', 'x-mock': 'true' },
      data,
    };
  }
}
