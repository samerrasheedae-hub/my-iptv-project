import { safeFireAndForget } from '@/stability/safeFireAndForget';
import { XtreamEngine } from '@/xtream/engine/XtreamEngine';
import { XtreamCacheLayer } from '@/xtream/cache/XtreamCacheLayer';
import { XtreamContentKind, XtreamSyncStatus } from '@/xtream/types';

type Listener = (status: XtreamSyncStatus) => void;

export interface BackgroundSyncEngine {
  start(playlistId: string): void;
  stop(): void;
  runOnce(playlistId: string): Promise<void>;
  getStatus(): XtreamSyncStatus;
  subscribe(listener: Listener): () => void;
}

export interface BackgroundSyncOptions {
  intervalMs?: number;
  pageSize?: number;
  maxCategoriesPerCycle?: number;
}

export class XtreamBackgroundSyncEngine implements BackgroundSyncEngine {
  private timer?: ReturnType<typeof setInterval>;
  private status: XtreamSyncStatus = 'idle';
  private listeners = new Set<Listener>();
  private running = false;

  constructor(
    private readonly engine: XtreamEngine,
    private readonly cache: XtreamCacheLayer,
    private readonly options: BackgroundSyncOptions = {},
  ) {}

  start(playlistId: string): void {
    this.stop();
    this.timer = setInterval(() => safeFireAndForget(this.runOnce(playlistId), 'xtream_background_sync'), this.options.intervalMs ?? 1000 * 60 * 15);
    safeFireAndForget(this.runOnce(playlistId), 'xtream_background_sync');
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    this.patch('idle');
  }

  async runOnce(playlistId: string): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.patch('syncing');
    try {
      await this.engine.loadAccountInfo(playlistId);
      await Promise.all([
        this.engine.loadCategories({ playlistId, kind: 'live', limit: 50 }),
        this.engine.loadCategories({ playlistId, kind: 'movie', limit: 50 }),
        this.engine.loadCategories({ playlistId, kind: 'series', limit: 50 }),
      ]);

      const cached = await this.cache.getCachedCategoryRefs(playlistId);
      const max = this.options.maxCategoriesPerCycle ?? 6;
      for (const ref of cached.slice(0, max)) {
        await this.engine.refreshCachedCategory(playlistId, ref.categoryId, ref.kind as XtreamContentKind);
      }
      this.patch('idle');
    } catch {
      this.patch('error');
    } finally {
      this.running = false;
    }
  }

  getStatus(): XtreamSyncStatus {
    return this.status;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  private patch(status: XtreamSyncStatus) {
    this.status = status;
    this.listeners.forEach((listener) => listener(status));
  }
}
