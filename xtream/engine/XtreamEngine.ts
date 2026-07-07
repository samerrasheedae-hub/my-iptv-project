import { XtreamCacheLayer } from '@/xtream/cache/XtreamCacheLayer';
import { XtreamService } from '@/xtream/services/XtreamService';
import {
  XtreamAccountInfo,
  XtreamAuthenticationInput,
  XtreamCategory,
  XtreamCategoryRequest,
  XtreamEngineState,
  XtreamPage,
  XtreamPlaybackSource,
  XtreamSession,
  XtreamStreamResolutionRequest,
  XtreamStreamSummary,
  XtreamStreamsByCategoryRequest,
} from '@/xtream/types';

type InFlightKey = string;
type Listener = (state: XtreamEngineState) => void;

export interface XtreamEngine {
  authenticate(input: XtreamAuthenticationInput): Promise<XtreamSession>;
  loadAccountInfo(playlistId: string, signal?: AbortSignal): Promise<XtreamAccountInfo>;
  loadCategories(request: XtreamCategoryRequest): Promise<XtreamPage<XtreamCategory>>;
  loadStreamsByCategory(request: XtreamStreamsByCategoryRequest): Promise<XtreamPage<XtreamStreamSummary>>;
  resolvePlaybackSource(request: XtreamStreamResolutionRequest): Promise<XtreamPlaybackSource>;
  refreshCachedCategory(playlistId: string, categoryId: string, kind: XtreamStreamsByCategoryRequest['kind']): Promise<void>;
  getState(): XtreamEngineState;
  subscribe(listener: Listener): () => void;
  cancelAll(): void;
}

export class ProductionXtreamEngine implements XtreamEngine {
  private readonly inFlight = new Map<InFlightKey, Promise<unknown>>();
  private readonly controllers = new Set<AbortController>();
  private readonly listeners = new Set<Listener>();
  private state: XtreamEngineState = { syncStatus: 'idle', cachedCategoryIds: [], updatedAt: new Date().toISOString() };

  constructor(
    private readonly service: XtreamService,
    private readonly cache: XtreamCacheLayer,
  ) {}

  async authenticate(input: XtreamAuthenticationInput): Promise<XtreamSession> {
    this.service.prepareConnection?.(input);
    return this.dedupe(`auth:${input.playlistId}`, async () => {
      const scoped = this.createScopedSignal(input.signal);
      try {
        const session = await this.cache.getOrRefreshSession(input.playlistId, () => this.service.authenticate({ ...input, signal: scoped.signal }));
        const account = await this.loadAccountInfo(input.playlistId, scoped.signal);
        await Promise.all([
          this.loadCategories({ playlistId: input.playlistId, kind: 'live', limit: Number.MAX_SAFE_INTEGER, signal: scoped.signal }),
          this.loadCategories({ playlistId: input.playlistId, kind: 'movie', limit: Number.MAX_SAFE_INTEGER, signal: scoped.signal }),
          this.loadCategories({ playlistId: input.playlistId, kind: 'series', limit: Number.MAX_SAFE_INTEGER, signal: scoped.signal }),
        ]);
        const cached = await this.cache.getCachedCategoryRefs(input.playlistId);
        this.patch({ playlistId: input.playlistId, session, account, cachedCategoryIds: cached.map((ref) => ref.categoryId) });
        return session;
      } finally {
        scoped.dispose();
      }
    });
  }

  async loadAccountInfo(playlistId: string, signal?: AbortSignal): Promise<XtreamAccountInfo> {
    return this.dedupe(`account:${playlistId}`, async () => {
      const scoped = this.createScopedSignal(signal);
      try {
        const account = await this.cache.getOrRefreshAccount(playlistId, () => this.service.getAccountInfo(playlistId, scoped.signal));
        this.patch({ playlistId, account });
        return account;
      } finally {
        scoped.dispose();
      }
    });
  }

  async loadCategories(request: XtreamCategoryRequest): Promise<XtreamPage<XtreamCategory>> {
    const key = `categories:${request.playlistId}:${request.kind}:${request.cursor ?? 'first'}:${request.limit}`;
    return this.dedupe(key, async () => {
      const scoped = this.createScopedSignal(request.signal);
      try {
        return await this.cache.getOrRefreshCategories(
          request.playlistId,
          request.kind,
          request.cursor,
          request.limit,
          () => this.service.getCategories({ ...request, signal: scoped.signal }),
        );
      } finally {
        scoped.dispose();
      }
    });
  }

  async loadStreamsByCategory(request: XtreamStreamsByCategoryRequest): Promise<XtreamPage<XtreamStreamSummary>> {
    const key = `streams:${request.playlistId}:${request.categoryId}:${request.kind}:${request.cursor ?? 'first'}:${request.limit}`;
    return this.dedupe(key, async () => {
      const scoped = this.createScopedSignal(request.signal);
      try {
        const page = await this.cache.getOrRefreshStreams(
          request.playlistId,
          request.categoryId,
          request.kind,
          request.cursor,
          request.limit,
          request.forceRefresh,
          () => this.service.getStreamsByCategory({ ...request, cursor: undefined, limit: Number.MAX_SAFE_INTEGER, signal: scoped.signal }),
        );
        const cached = await this.cache.getCachedCategoryRefs(request.playlistId);
        this.patch({ playlistId: request.playlistId, cachedCategoryIds: cached.map((ref) => ref.categoryId) });
        return page;
      } finally {
        scoped.dispose();
      }
    });
  }


  async resolvePlaybackSource(request: XtreamStreamResolutionRequest): Promise<XtreamPlaybackSource> {
    return this.dedupe(`playback-source:${request.playlistId}:${request.kind}:${request.streamId}:${request.outputFormat ?? 'auto'}`, () =>
      this.service.resolvePlaybackSource(request),
    );
  }

  async refreshCachedCategory(playlistId: string, categoryId: string, kind: XtreamStreamsByCategoryRequest['kind']): Promise<void> {
    await this.loadStreamsByCategory({ playlistId, categoryId, kind, limit: 50, forceRefresh: true });
  }

  getState(): XtreamEngineState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  cancelAll(): void {
    this.controllers.forEach((controller) => controller.abort());
    this.controllers.clear();
  }

  private async dedupe<T>(key: InFlightKey, loader: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key) as Promise<T> | undefined;
    if (existing) return existing;

    const promise = loader()
      .catch((error: Error) => {
        this.patch({ lastError: error.message, syncStatus: 'error' });
        throw error;
      })
      .finally(() => this.inFlight.delete(key));

    this.inFlight.set(key, promise);
    return promise;
  }

  private createScopedSignal(external?: AbortSignal) {
    const controller = new AbortController();
    this.controllers.add(controller);
    const abort = () => controller.abort();
    if (external?.aborted) controller.abort();
    else external?.addEventListener('abort', abort, { once: true });
    return {
      signal: controller.signal,
      dispose: () => {
        external?.removeEventListener('abort', abort);
        this.controllers.delete(controller);
      },
    };
  }

  private patch(update: Partial<XtreamEngineState>) {
    this.state = { ...this.state, ...update, updatedAt: new Date().toISOString() };
    this.listeners.forEach((listener) => listener(this.state));
  }
}
