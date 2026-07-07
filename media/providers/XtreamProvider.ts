import { MediaProvider } from '@/media/providers/MediaProvider';
import {
  UnifiedCategory,
  UnifiedCategoryMediaRequest,
  UnifiedCategoryRequest,
  UnifiedHomeFeed,
  UnifiedMediaItem,
  UnifiedPage,
  UnifiedSearchRequest,
} from '@/media/types';
import { XtreamRepository } from '@/xtream/repositories/XtreamRepository';
import { XtreamCategory, XtreamContentKind, XtreamStreamSummary } from '@/xtream/types';

const page = <T>(items: T[], limit: number, cursor?: string): UnifiedPage<T> => {
  const offset = cursor ? Number(cursor) : 0;
  const nextOffset = offset + limit;
  return { items: items.slice(offset, nextOffset), nextCursor: nextOffset < items.length ? String(nextOffset) : undefined, totalEstimate: items.length };
};

const xtreamKind = (kind?: string): XtreamContentKind => {
  if (kind === 'movie') return 'movie';
  if (kind === 'series') return 'series';
  return 'live';
};

export class XtreamProvider implements MediaProvider {
  readonly kind = 'xtream' as const;

  constructor(private readonly repository: XtreamRepository) {}

  async listCategories(request: UnifiedCategoryRequest): Promise<UnifiedPage<UnifiedCategory>> {
    if (!request.playlistId) return { items: [] };
    const kinds: XtreamContentKind[] = request.kind && request.kind !== 'mixed'
      ? [xtreamKind(request.kind)]
      : ['live', 'movie', 'series'];

    const pages = await Promise.all(kinds.map((kind) => this.repository.listCategories({
      playlistId: request.playlistId as string,
      kind,
      limit: request.limit,
      cursor: request.cursor,
      signal: request.signal,
    })));

    const items = pages.flatMap((result) => result.items.map((category) => this.mapCategory(category)));
    return { items, nextCursor: pages.find((result) => result.nextCursor)?.nextCursor, totalEstimate: pages.reduce((sum, result) => sum + (result.totalEstimate ?? result.items.length), 0) };
  }

  async listMediaByCategory(request: UnifiedCategoryMediaRequest): Promise<UnifiedPage<UnifiedMediaItem>> {
    const pageResult = await this.repository.listStreamsByCategory({
      playlistId: request.playlistId,
      categoryId: request.categoryId,
      kind: xtreamKind(request.kind),
      limit: request.limit,
      cursor: request.cursor,
      forceRefresh: request.forceRefresh,
      signal: request.signal,
    });
    return { ...pageResult, items: pageResult.items.map((item) => this.mapStream(item)) };
  }

  async search(request: UnifiedSearchRequest): Promise<UnifiedPage<UnifiedMediaItem>> {
    if (!request.playlistId) return { items: [] };
    const categories = await this.listCategories({ playlistId: request.playlistId, kind: request.kinds?.[0] ?? 'mixed', limit: 30, signal: request.signal });
    const query = request.query.trim().toLowerCase();
    const pages = await Promise.all(categories.items.slice(0, 8).map((category) => this.listMediaByCategory({
      playlistId: category.playlistId,
      providerKind: 'xtream',
      categoryId: category.id,
      kind: category.kind === 'mixed' ? undefined : category.kind,
      limit: 100,
      signal: request.signal,
    })));
    const matches = pages.flatMap((result) => result.items).filter((item) => item.searchText.includes(query));
    return page(matches, request.limit, request.cursor);
  }

  async getHomeFeed(playlistId?: string): Promise<UnifiedHomeFeed> {
    if (!playlistId) return { rows: [], generatedAt: new Date().toISOString() };
    const categories = await this.listCategories({ playlistId, limit: 12 });
    const rows = await Promise.all(categories.items.slice(0, 5).map(async (category) => {
      const media = await this.listMediaByCategory({ playlistId, providerKind: 'xtream', categoryId: category.id, kind: category.kind === 'mixed' ? undefined : category.kind, limit: 12 });
      return { id: `xtream:${category.id}`, title: category.title, kind: category.kind, providerKind: 'xtream' as const, playlistId, categoryId: category.id, items: media.items, nextCursor: media.nextCursor };
    }));
    return { hero: rows[0]?.items[0], rows, generatedAt: new Date().toISOString() };
  }

  private mapCategory(category: XtreamCategory): UnifiedCategory {
    return {
      id: category.id,
      playlistId: category.playlistId,
      providerKind: 'xtream',
      title: category.title,
      kind: category.kind === 'live' ? 'channel' : category.kind,
      itemCountEstimate: category.itemCountEstimate,
      sortOrder: category.sortOrder,
      updatedAt: category.updatedAt,
    };
  }

  private mapStream(stream: XtreamStreamSummary): UnifiedMediaItem {
    const base = {
      id: `xtream:${stream.playlistId}:${stream.id}`,
      playlistId: stream.playlistId,
      providerKind: 'xtream' as const,
      categoryId: stream.categoryId,
      title: stream.title,
      posterUrl: stream.posterUrl,
      backdropUrl: stream.backdropUrl,
      provider: { providerKind: 'xtream' as const, playlistId: stream.playlistId, externalId: stream.id, categoryId: stream.categoryId },
      searchText: `${stream.title} ${stream.kind}`.toLowerCase(),
      updatedAt: stream.updatedAt,
    };
    if (stream.kind === 'live') return { ...base, kind: 'channel', isLive: true, logoUrl: stream.posterUrl };
    if (stream.kind === 'series') return { ...base, kind: 'series', releaseYear: stream.releaseYear, rating: stream.rating };
    return { ...base, kind: 'movie', releaseYear: stream.releaseYear, durationSeconds: stream.durationSeconds, rating: stream.rating };
  }
}
