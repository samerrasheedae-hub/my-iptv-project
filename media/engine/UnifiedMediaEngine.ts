import { UnifiedMediaCache } from '@/media/cache/UnifiedMediaCache';
import { MediaProvider } from '@/media/providers/MediaProvider';
import {
  UnifiedCategory,
  UnifiedCategoryMediaRequest,
  UnifiedCategoryRequest,
  UnifiedHomeFeed,
  UnifiedHomeRow,
  UnifiedMediaItem,
  UnifiedPage,
  UnifiedProviderKind,
  UnifiedSearchRequest,
} from '@/media/types';

export interface UnifiedMediaEngine {
  registerProvider(provider: MediaProvider): void;
  listCategories(request: UnifiedCategoryRequest): Promise<UnifiedPage<UnifiedCategory>>;
  listMediaByCategory(request: UnifiedCategoryMediaRequest): Promise<UnifiedPage<UnifiedMediaItem>>;
  search(request: UnifiedSearchRequest): Promise<UnifiedPage<UnifiedMediaItem>>;
  getHomeFeed(playlistIds?: Partial<Record<UnifiedProviderKind, string>>): Promise<UnifiedHomeFeed>;
}

export class ProductionUnifiedMediaEngine implements UnifiedMediaEngine {
  private readonly providers = new Map<UnifiedProviderKind, MediaProvider>();
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(private readonly cache: UnifiedMediaCache) {}

  registerProvider(provider: MediaProvider): void {
    this.providers.set(provider.kind, provider);
  }

  async listCategories(request: UnifiedCategoryRequest): Promise<UnifiedPage<UnifiedCategory>> {
    const key = this.cacheKey('categories', request);
    return this.dedupe(key, () => this.cache.getOrRefreshCategories(key, request.playlistId, async () => {
      if (request.providerKind) return this.requireProvider(request.providerKind).listCategories(request);
      const providers = this.selectProviders();
      const providerRequest = { ...request, cursor: undefined };
      const pages = await Promise.all(providers.map((provider) => provider.listCategories(providerRequest)));
      return this.mergePages(pages, request.limit, request.cursor);
    }));
  }

  async listMediaByCategory(request: UnifiedCategoryMediaRequest): Promise<UnifiedPage<UnifiedMediaItem>> {
    const key = this.cacheKey('category-media', request);
    return this.dedupe(key, () => this.cache.getOrRefreshMedia(key, request.playlistId, async () => this.requireProvider(request.providerKind).listMediaByCategory(request)));
  }

  async search(request: UnifiedSearchRequest): Promise<UnifiedPage<UnifiedMediaItem>> {
    const key = this.cacheKey('search', request);
    return this.dedupe(key, () => this.cache.getOrRefreshSearch(key, request.playlistId, async () => {
      if (request.providerKind) return this.requireProvider(request.providerKind).search(request);
      const providers = this.selectProviders();
      const providerRequest = { ...request, cursor: undefined };
      const pages = await Promise.all(providers.map((provider) => provider.search(providerRequest)));
      const merged = this.dedupeMedia(pages.flatMap((page) => page.items));
      return this.page(merged, request.limit, request.cursor);
    }));
  }

  async getHomeFeed(playlistIds: Partial<Record<UnifiedProviderKind, string>> = {}): Promise<UnifiedHomeFeed> {
    const key = this.cacheKey('home', playlistIds);
    return this.dedupe(key, () => this.cache.getOrRefreshHome(key, undefined, async () => {
      const feeds = await Promise.all([...this.providers.values()].map((provider) => provider.getHomeFeed(playlistIds[provider.kind])));
      const rows: UnifiedHomeRow[] = feeds.flatMap((feed) => feed.rows);
      const hero = feeds.find((feed) => feed.hero)?.hero;
      return { hero, rows, generatedAt: new Date().toISOString() };
    }));
  }

  private async dedupe<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key) as Promise<T> | undefined;
    if (existing) return existing;
    const promise = loader().finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, promise);
    return promise;
  }

  private cacheKey(scope: string, value: unknown) {
    return JSON.stringify({ scope, value });
  }

  private selectProviders(kind?: UnifiedProviderKind) {
    return kind ? [this.requireProvider(kind)] : [...this.providers.values()];
  }

  private requireProvider(kind: UnifiedProviderKind) {
    const provider = this.providers.get(kind);
    if (!provider) throw new Error(`Media provider is not registered: ${kind}`);
    return provider;
  }

  private mergePages<T extends { id: string }>(pages: UnifiedPage<T>[], limit: number, cursor?: string): UnifiedPage<T> {
    return this.page(this.dedupeById(pages.flatMap((page) => page.items)), limit, cursor);
  }

  private dedupeMedia(items: UnifiedMediaItem[]) {
    return this.dedupeById(items);
  }

  private dedupeById<T extends { id: string }>(items: T[]) {
    const map = new Map<string, T>();
    items.forEach((item) => map.set(item.id, item));
    return [...map.values()];
  }

  private page<T>(items: T[], limit: number, cursor?: string): UnifiedPage<T> {
    const offset = cursor ? Number(cursor) : 0;
    const nextOffset = offset + limit;
    return { items: items.slice(offset, nextOffset), nextCursor: nextOffset < items.length ? String(nextOffset) : undefined, totalEstimate: items.length };
  }
}
