import { NetworkRepository } from '@/network';
import {
  XtreamAccountInfo,
  XtreamAuthenticationInput,
  XtreamCategory,
  XtreamCategoryRequest,
  XtreamContentKind,
  XtreamPage,
  XtreamPlaybackSource,
  XtreamSession,
  XtreamStreamResolutionRequest,
  XtreamStreamSummary,
  XtreamStreamsByCategoryRequest,
} from '@/xtream/types';
import { buildXtreamPlaybackSource } from '@/xtream/playback/XtreamStreamResolver';

export interface XtreamService {
  prepareConnection?(input: XtreamAuthenticationInput): void;
  authenticate(input: XtreamAuthenticationInput): Promise<XtreamSession>;
  getAccountInfo(playlistId: string, signal?: AbortSignal): Promise<XtreamAccountInfo>;
  getCategories(request: XtreamCategoryRequest): Promise<XtreamPage<XtreamCategory>>;
  getStreamsByCategory(request: XtreamStreamsByCategoryRequest): Promise<XtreamPage<XtreamStreamSummary>>;
  resolvePlaybackSource(request: XtreamStreamResolutionRequest): Promise<XtreamPlaybackSource>;
}

interface XtreamConnection {
  playlistId: string;
  serverUrl: string;
  username: string;
  password: string;
}

interface XtreamAuthResponse {
  user_info?: {
    auth?: number | string;
    username?: string;
    status?: string;
    exp_date?: string | number;
    max_connections?: string | number;
    active_cons?: string | number;
    allowed_output_formats?: string[];
  };
  server_info?: {
    time_now?: string;
    timestamp_now?: string | number;
  };
}

interface XtreamCategoryResponse {
  category_id?: string | number;
  category_name?: string;
  parent_id?: string | number;
}

interface XtreamStreamResponse {
  stream_id?: string | number;
  series_id?: string | number;
  name?: string;
  title?: string;
  stream_icon?: string;
  cover?: string;
  category_id?: string | number;
  added?: string | number;
  last_modified?: string | number;
  rating?: string | number;
  rating_5based?: string | number;
  releaseDate?: string;
  year?: string | number;
  duration_secs?: string | number;
  duration?: string;
}

const now = () => new Date().toISOString();
const toNumber = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};
const unixToIso = (value: unknown) => {
  const number = toNumber(value);
  return number ? new Date(number * 1000).toISOString() : undefined;
};
const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

export class BackendXtreamService implements XtreamService {
  private readonly connections = new Map<string, XtreamConnection>();
  private readonly accounts = new Map<string, XtreamAccountInfo>();

  constructor(private readonly networkRepository: NetworkRepository) {}

  prepareConnection(input: XtreamAuthenticationInput): void {
    this.connections.set(input.playlistId, this.createConnection(input));
  }

  async authenticate(input: XtreamAuthenticationInput): Promise<XtreamSession> {
    const connection = this.createConnection(input);
    this.connections.set(input.playlistId, connection);
    const auth = await this.call<XtreamAuthResponse>(connection, {}, input.signal);
    const user = auth.user_info;

    if (!user || String(user.auth ?? '1') === '0') {
      throw new Error('Xtream authentication failed');
    }

    this.accounts.set(input.playlistId, this.mapAccountInfo(connection.playlistId, auth));

    return {
      id: `xtream-session-${input.playlistId}`,
      playlistId: input.playlistId,
      accountId: `xtream-account-${input.playlistId}`,
      status: 'authenticated',
      authenticatedAt: now(),
      expiresAt: unixToIso(user.exp_date),
    };
  }

  async getAccountInfo(playlistId: string, signal?: AbortSignal): Promise<XtreamAccountInfo> {
    const connection = this.requireConnection(playlistId);
    const auth = await this.call<XtreamAuthResponse>(connection, {}, signal);
    const account = this.mapAccountInfo(playlistId, auth);
    this.accounts.set(playlistId, account);
    return account;
  }

  async getCategories(request: XtreamCategoryRequest): Promise<XtreamPage<XtreamCategory>> {
    const connection = this.requireConnection(request.playlistId);
    const action = this.categoryAction(request.kind);
    const response = await this.call<XtreamCategoryResponse[]>(connection, { action }, request.signal);
    const categories = (Array.isArray(response) ? response : []).map((item, index) => this.mapCategory(request.playlistId, request.kind, item, index));
    return this.page(categories, request.limit, request.cursor);
  }

  async getStreamsByCategory(request: XtreamStreamsByCategoryRequest): Promise<XtreamPage<XtreamStreamSummary>> {
    const connection = this.requireConnection(request.playlistId);
    const action = this.streamAction(request.kind);
    const response = await this.call<XtreamStreamResponse[]>(connection, {
      action,
      category_id: request.categoryId,
    }, request.signal);

    const streams = (Array.isArray(response) ? response : []).map((item) => this.mapStream(request.playlistId, request.categoryId, request.kind, item));
    return this.page(streams, request.limit, request.cursor);
  }


  async resolvePlaybackSource(request: XtreamStreamResolutionRequest): Promise<XtreamPlaybackSource> {
    const connection = this.requireConnection(request.playlistId);
    return buildXtreamPlaybackSource(connection, request, this.accounts.get(request.playlistId));
  }

  private async call<T>(connection: XtreamConnection, query: Record<string, string | number | boolean | undefined>, signal?: AbortSignal): Promise<T> {
    const response = await this.networkRepository.request<T>({
      method: 'GET',
      baseUrl: connection.serverUrl,
      url: '/player_api.php',
      query: {
        username: connection.username,
        password: connection.password,
        ...query,
      },
      requiresAuth: false,
      signal,
      timeoutMs: 15_000,
      retryPolicy: { retries: 2, baseDelayMs: 500, maxDelayMs: 5_000 },
      metadata: { playlistId: connection.playlistId, provider: 'xtream' },
    });
    return response.data;
  }

  private createConnection(input: XtreamAuthenticationInput): XtreamConnection {
    if (!input.serverUrlRef) throw new Error('Xtream server URL is required');
    if (!input.passwordRef) throw new Error('Xtream password is required');
    return {
      playlistId: input.playlistId,
      serverUrl: normalizeBaseUrl(input.serverUrlRef),
      username: input.username,
      password: input.passwordRef,
    };
  }

  private requireConnection(playlistId: string): XtreamConnection {
    const connection = this.connections.get(playlistId);
    if (!connection) throw new Error('Xtream account is not authenticated');
    return connection;
  }

  private mapAccountInfo(playlistId: string, response: XtreamAuthResponse): XtreamAccountInfo {
    const user = response.user_info ?? {};
    return {
      playlistId,
      accountId: `xtream-account-${playlistId}`,
      username: user.username ?? 'unknown',
      status: this.mapStatus(user.status),
      maxConnections: toNumber(user.max_connections),
      activeConnections: toNumber(user.active_cons),
      expiresAt: unixToIso(user.exp_date),
      serverTime: response.server_info?.time_now ?? unixToIso(response.server_info?.timestamp_now),
      allowedOutputFormats: user.allowed_output_formats ?? [],
    };
  }

  private mapStatus(status: unknown): XtreamAccountInfo['status'] {
    const normalized = String(status ?? 'unknown').toLowerCase();
    if (normalized.includes('active')) return 'active';
    if (normalized.includes('expired')) return 'expired';
    if (normalized.includes('disabled') || normalized.includes('banned')) return 'disabled';
    return 'unknown';
  }

  private mapCategory(playlistId: string, kind: XtreamContentKind, item: XtreamCategoryResponse, index: number): XtreamCategory {
    return {
      id: String(item.category_id ?? `${kind}-${index}`),
      playlistId,
      kind,
      title: item.category_name ?? `${kind} Category ${index + 1}`,
      parentId: item.parent_id !== undefined ? String(item.parent_id) : undefined,
      sortOrder: index,
      updatedAt: now(),
    };
  }

  private mapStream(playlistId: string, categoryId: string, kind: XtreamContentKind, item: XtreamStreamResponse): XtreamStreamSummary {
    const id = String(kind === 'series' ? item.series_id ?? item.stream_id : item.stream_id ?? item.series_id);
    const posterUrl = kind === 'series' ? item.cover ?? item.stream_icon : item.stream_icon ?? item.cover;
    return {
      id,
      playlistId,
      categoryId: String(item.category_id ?? categoryId),
      kind,
      title: item.name ?? item.title ?? `${kind} ${id}`,
      posterUrl,
      backdropUrl: posterUrl,
      releaseYear: this.extractYear(item),
      durationSeconds: toNumber(item.duration_secs),
      rating: toNumber(item.rating_5based) ?? toNumber(item.rating),
      isLive: kind === 'live',
      updatedAt: unixToIso(item.last_modified ?? item.added) ?? now(),
    };
  }

  private extractYear(item: XtreamStreamResponse) {
    const explicit = toNumber(item.year);
    if (explicit) return explicit;
    const match = String(item.releaseDate ?? '').match(/\d{4}/);
    return match ? Number(match[0]) : undefined;
  }

  private categoryAction(kind: XtreamContentKind) {
    switch (kind) {
      case 'live': return 'get_live_categories';
      case 'movie': return 'get_vod_categories';
      case 'series': return 'get_series_categories';
    }
  }

  private streamAction(kind: XtreamContentKind) {
    switch (kind) {
      case 'live': return 'get_live_streams';
      case 'movie': return 'get_vod_streams';
      case 'series': return 'get_series';
    }
  }

  private page<T>(items: T[], limit: number, cursor?: string): XtreamPage<T> {
    const offset = cursor ? Number(cursor) : 0;
    const nextOffset = offset + limit;
    return {
      items: items.slice(offset, nextOffset),
      nextCursor: nextOffset < items.length ? String(nextOffset) : undefined,
      totalEstimate: items.length,
    };
  }
}
