import { HttpTransport, HttpTransportRequest, HttpTransportResponse } from '@/network';
import { AppLogger } from '@/stability/AppLogger';

export class XtreamFetchTransport implements HttpTransport {
  async send<T>(request: HttpTransportRequest): Promise<HttpTransportResponse<T>> {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body ? JSON.stringify(request.body) : undefined,
      signal: request.signal,
    });

    const contentType = response.headers.get('content-type') ?? '';
    const text = await response.text();
    const data = this.parseBody(text, contentType);

    const headers: Record<string, string> = {};
    response.headers.forEach((value: string, key: string) => {
      headers[key] = value;
    });

    return {
      status: response.status,
      ok: response.ok,
      url: response.url,
      headers,
      data: data as T,
    };
  }

  private parseBody(text: string, contentType: string): unknown {
    if (!text) return null;
    const trimmed = text.trim();
    const shouldParseJson = contentType.includes('application/json') || trimmed.startsWith('{') || trimmed.startsWith('[');
    if (!shouldParseJson) return text;
    try {
      return JSON.parse(text);
    } catch (error) {
      AppLogger.warn('xtream_response_json_parse_failed', { error: String(error) });
      return text;
    }
  }
}
