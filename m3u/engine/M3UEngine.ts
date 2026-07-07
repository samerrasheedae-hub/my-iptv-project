import { M3UCacheLayer } from '@/m3u/cache/M3UCacheLayer';
import { M3UService } from '@/m3u/services/M3UService';
import {
  M3UCategory,
  M3UCategoryRequest,
  M3UEngineState,
  M3UPage,
  M3URegisterSourceInput,
  M3USourceDescriptor,
  M3USourceStatus,
  M3UStreamMetadata,
  M3UStreamsByCategoryRequest,
} from '@/m3u/types';

type Listener = (state: M3UEngineState) => void;

type InFlightKey = string;

export interface M3UEngine {
  registerSource(input: M3URegisterSourceInput): Promise<M3USourceDescriptor>;
  checkSource(playlistId: string, signal?: AbortSignal): Promise<M3USourceStatus>;
  loadCategories(request: M3UCategoryRequest): Promise<M3UPage<M3UCategory>>;
  loadStreamsByCategory(request: M3UStreamsByCategoryRequest): Promise<M3UPage<M3UStreamMetadata>>;
  refreshCachedCategory(playlistId: string, categoryId: string): Promise<void>;
  getState(): M3UEngineState;
  subscribe(listener: Listener): () => void;
  cancelAll(): void;
}

export class ProductionM3UEngine implements M3UEngine {
  private readonly inFlight = new Map<InFlightKey, Promise<unknown>>();
  private readonly controllers = new Set<AbortController>();
  private readonly listeners = new Set<Listener>();
  private state: M3UEngineState = { syncStatus: 'idle', cachedCategoryIds: [], updatedAt: new Date().toISOString() };

  constructor(
    private readonly service: M3UService,
    private readonly cache: M3UCacheLayer,
  ) {}

  async registerSource(input: M3URegisterSourceInput): Promise<M3USourceDescriptor> {
    return this.dedupe(`source:${input.playlistId}`, async () => {
      const scoped = this.createScopedSignal(input.signal);
      try {
        this.service.prepareSource?.({ playlistId: input.playlistId, kind: input.kind, uri: input.uri, displayName: input.displayName, epgUri: input.epgUri, headers: input.headers, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        const source = await this.cache.getOrRefreshSource(input.playlistId, () => this.service.registerSource({ ...input, signal: scoped.signal }));
        this.patch({ playlistId: input.playlistId, source, syncStatus: 'indexing' });
        // Index categories immediately, but never parse/load category streams here.
        await this.loadCategories({ playlistId: input.playlistId, limit: 250, signal: scoped.signal });
        const cachedCategoryIds = await this.cache.getCachedCategoryIds(input.playlistId);
        this.patch({ syncStatus: 'idle', cachedCategoryIds });
        return source;
      } finally {
        scoped.dispose();
      }
    });
  }

  async checkSource(playlistId: string, signal?: AbortSignal): Promise<M3USourceStatus> {
    return this.dedupe(`status:${playlistId}`, async () => {
      const scoped = this.createScopedSignal(signal);
      try {
        return await this.cache.getOrRefreshSourceStatus(playlistId, () => this.service.checkSource(playlistId, scoped.signal));
      } finally {
        scoped.dispose();
      }
    });
  }

  async loadCategories(request: M3UCategoryRequest): Promise<M3UPage<M3UCategory>> {
    const key = `categories:${request.playlistId}:${request.cursor ?? 'first'}:${request.limit}`;
    return this.dedupe(key, async () => {
      const scoped = this.createScopedSignal(request.signal);
      try {
        return await this.cache.getOrRefreshCategories(
          request.playlistId,
          request.cursor,
          request.limit,
          () => this.service.getCategories({ ...request, signal: scoped.signal }),
        );
      } finally {
        scoped.dispose();
      }
    });
  }

  async loadStreamsByCategory(request: M3UStreamsByCategoryRequest): Promise<M3UPage<M3UStreamMetadata>> {
    const key = `streams:${request.playlistId}:${request.categoryId}:${request.cursor ?? 'first'}:${request.limit}`;
    return this.dedupe(key, async () => {
      const scoped = this.createScopedSignal(request.signal);
      try {
        const page = await this.cache.getOrRefreshStreams(
          request.playlistId,
          request.categoryId,
          request.cursor,
          request.limit,
          request.forceRefresh,
          () => this.service.getStreamsByCategory({ ...request, signal: scoped.signal }),
        );
        const cachedCategoryIds = await this.cache.getCachedCategoryIds(request.playlistId);
        this.patch({ playlistId: request.playlistId, cachedCategoryIds });
        return page;
      } finally {
        scoped.dispose();
      }
    });
  }

  async refreshCachedCategory(playlistId: string, categoryId: string): Promise<void> {
    await this.loadStreamsByCategory({ playlistId, categoryId, limit: 100, forceRefresh: true });
  }

  getState(): M3UEngineState {
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

  private patch(update: Partial<M3UEngineState>) {
    this.state = { ...this.state, ...update, updatedAt: new Date().toISOString() };
    this.listeners.forEach((listener) => listener(this.state));
  }
}
