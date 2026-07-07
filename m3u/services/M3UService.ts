import { NetworkRepository } from '@/network';
import {
  M3UCategory,
  M3UCategoryRequest,
  M3UPage,
  M3URegisterSourceInput,
  M3USourceDescriptor,
  M3USourceStatus,
  M3UStreamMetadata,
  M3UStreamsByCategoryRequest,
} from '@/m3u/types';
import { categoryIdForGroup } from '@/m3u/parser/M3UStreamMapper';

export interface M3UService {
  prepareSource?(source: M3USourceDescriptor): void;
  registerSource(input: M3URegisterSourceInput): Promise<M3USourceDescriptor>;
  checkSource(playlistId: string, signal?: AbortSignal): Promise<M3USourceStatus>;
  getCategories(request: M3UCategoryRequest): Promise<M3UPage<M3UCategory>>;
  getStreamsByCategory(request: M3UStreamsByCategoryRequest): Promise<M3UPage<M3UStreamMetadata>>;
}

const now = () => new Date().toISOString();
const page = <T>(items: T[], limit: number, cursor?: string): M3UPage<T> => {
  const offset = cursor ? Number(cursor) : 0;
  const nextOffset = offset + limit;
  return { items: items.slice(offset, nextOffset), nextCursor: nextOffset < items.length ? String(nextOffset) : undefined, totalEstimate: items.length };
};

export class BackendM3UService implements M3UService {
  private readonly sources = new Map<string, M3USourceDescriptor>();

  constructor(private readonly networkRepository: NetworkRepository) {}

  prepareSource(source: M3USourceDescriptor): void {
    this.sources.set(source.playlistId, source);
  }

  async registerSource(input: M3URegisterSourceInput): Promise<M3USourceDescriptor> {
    await this.networkRepository.request({
      method: 'POST',
      url: '/m3u/sources',
      body: { playlistId: input.playlistId, kind: input.kind, uri: input.uri, displayName: input.displayName, epgUri: input.epgUri },
      requiresAuth: true,
      signal: input.signal,
      timeoutMs: 10_000,
      metadata: { provider: 'm3u', operation: 'register-source' },
    });

    const source: M3USourceDescriptor = {
      playlistId: input.playlistId,
      kind: input.kind,
      uri: input.uri,
      displayName: input.displayName,
      epgUri: input.epgUri,
      headers: input.headers,
      createdAt: now(),
      updatedAt: now(),
    };
    this.sources.set(input.playlistId, source);
    return source;
  }

  async checkSource(playlistId: string, signal?: AbortSignal): Promise<M3USourceStatus> {
    this.requireSource(playlistId);
    await this.networkRepository.request({
      method: 'GET',
      url: `/m3u/sources/${encodeURIComponent(playlistId)}/status`,
      requiresAuth: true,
      signal,
      timeoutMs: 8_000,
      metadata: { provider: 'm3u', operation: 'check-source' },
    });

    return { playlistId, available: true, lastCheckedAt: now() };
  }

  async getCategories(request: M3UCategoryRequest): Promise<M3UPage<M3UCategory>> {
    this.requireSource(request.playlistId);
    await this.networkRepository.request({
      method: 'GET',
      url: `/m3u/sources/${encodeURIComponent(request.playlistId)}/categories`,
      query: { cursor: request.cursor, limit: request.limit },
      requiresAuth: true,
      signal: request.signal,
      timeoutMs: 12_000,
      metadata: { provider: 'm3u', operation: 'categories' },
    });

    // Backend is expected to build this index incrementally. This local fallback is structured mock data only.
    const groups = Array.from({ length: 72 }).map((_, index) => `M3U Group ${index + 1}`);
    const categories = groups.map((groupTitle, index) => ({
      id: categoryIdForGroup(request.playlistId, groupTitle),
      playlistId: request.playlistId,
      title: groupTitle,
      groupTitle,
      itemCountEstimate: 1400 + index * 11,
      sortOrder: index,
      updatedAt: now(),
    } satisfies M3UCategory));

    return page(categories, request.limit, request.cursor);
  }

  async getStreamsByCategory(request: M3UStreamsByCategoryRequest): Promise<M3UPage<M3UStreamMetadata>> {
    this.requireSource(request.playlistId);
    await this.networkRepository.request({
      method: 'GET',
      url: `/m3u/sources/${encodeURIComponent(request.playlistId)}/categories/${encodeURIComponent(request.categoryId)}/streams`,
      query: { cursor: request.cursor, limit: request.limit },
      requiresAuth: true,
      signal: request.signal,
      timeoutMs: 15_000,
      retryPolicy: { retries: 2, baseDelayMs: 500, maxDelayMs: 5_000 },
      metadata: { provider: 'm3u', operation: 'category-streams' },
    });

    const totalEstimate = 1800;
    const offset = request.cursor ? Number(request.cursor) : 0;
    const count = Math.max(0, Math.min(request.limit, totalEstimate - offset));
    const groupTitle = request.categoryId.split(':group:')[1] ?? 'group';
    const items = Array.from({ length: count }).map((_, index) => {
      const number = offset + index + 1;
      return {
        id: `${request.categoryId}:stream:${number}`,
        playlistId: request.playlistId,
        categoryId: request.categoryId,
        title: `M3U Channel ${number}`,
        url: `https://stream.example.invalid/${request.playlistId}/${request.categoryId}/${number}.m3u8`,
        logoUrl: undefined,
        tvgId: `${request.categoryId}-${number}`,
        tvgName: `M3U Channel ${number}`,
        groupTitle,
        kind: 'live',
        rawAttributes: { 'group-title': groupTitle, 'tvg-id': `${request.categoryId}-${number}` },
        updatedAt: now(),
      } satisfies M3UStreamMetadata;
    });
    const nextOffset = offset + items.length;
    return { items, nextCursor: nextOffset < totalEstimate ? String(nextOffset) : undefined, totalEstimate };
  }

  private requireSource(playlistId: string) {
    const source = this.sources.get(playlistId);
    if (!source) throw new Error('M3U source is not registered');
    return source;
  }
}

/*
 * Task 019f – 12.2 – M3U Service – functional connection layer
 * Added alongside BackendM3UService – does NOT break existing service
 * UI → Service → Repository → Engine ONLY
 * Preserve mock/fallback – no full playlist download – 100k+ optimized
 */

import type { M3UCategory } from '@/m3u/types';

/**
 * listCategories – Task 12 service contract
 * - q?: string – server-side filter
 * - MUST call repository ONLY – never engine directly
 * - Returns { data, fromMock }
 * - Paginated / 100k+ safe – caller controls paging via q filter, underlying repo caps at 500 items per Task 12
 */
export async function listCategories(
  repository: { listCategories: (req: any) => Promise<any> },
  playlistId: string,
  q?: string,
  signal?: AbortSignal
): Promise<{ data: M3UCategory[]; fromMock: boolean }> {
  // Import dynamically to avoid circular deps – keeps existing architecture intact
  const { listCategoriesTask12 } = await import('@/m3u/repositories/M3URepository');
  try {
    return await listCategoriesTask12(repository, playlistId, q, signal);
  } catch (e) {
    // Fallback – preserve mock/fallback mode per project rules
    return { data: [], fromMock: true };
  }
}

/**
 * ServiceResult wrapper – matches Task 12 spec used by UI hook
 */
export type CategoryServiceResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
  fromMock?: boolean;
};

/**
 * Convenience wrapper used by hooks/useM3UCategoriesV2
 * Keeps existing BackendM3UService.getCategories(request: M3UCategoryRequest) untouched
 */
export async function listCategoriesSimple(
  playlistId: string,
  q?: string,
  deps?: {
    repository?: { listCategories: (req: any) => Promise<any> };
    signal?: AbortSignal;
  }
): Promise<CategoryServiceResult<M3UCategory[]>> {
  try {
    // If a repository instance is supplied (from UnifiedMediaRuntime / M3URuntime), use it – Service → Repository → Engine
    // Otherwise fallback to mock – preserves mock/fallback mode
    const repo = deps?.repository;
    if (!repo || !playlistId) {
      return { ok: true, data: [], fromMock: true };
    }
    const res = await listCategories(repo, playlistId, q, deps?.signal);
    return { ok: true, data: res.data, fromMock: res.fromMock };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'M3U category load failed', fromMock: true, data: [] };
  }
}
