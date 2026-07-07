import { safeFireAndForget } from '@/stability/safeFireAndForget';
import { M3UCacheLayer } from '@/m3u/cache/M3UCacheLayer';
import { M3UEngine } from '@/m3u/engine/M3UEngine';
import { M3USyncStatus } from '@/m3u/types';

type Listener = (status: M3USyncStatus) => void;

export interface BackgroundM3UParsingWorker {
  start(playlistId: string): void;
  stop(): void;
  runOnce(playlistId: string): Promise<void>;
  getStatus(): M3USyncStatus;
  subscribe(listener: Listener): () => void;
}

export interface BackgroundM3UParsingOptions {
  intervalMs?: number;
  maxCachedCategoriesPerCycle?: number;
}

export class ProductionBackgroundM3UParsingWorker implements BackgroundM3UParsingWorker {
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  private status: M3USyncStatus = 'idle';
  private readonly listeners = new Set<Listener>();

  constructor(
    private readonly engine: M3UEngine,
    private readonly cache: M3UCacheLayer,
    private readonly options: BackgroundM3UParsingOptions = {},
  ) {}

  start(playlistId: string): void {
    this.stop();
    this.timer = setInterval(() => safeFireAndForget(this.runOnce(playlistId), 'm3u_background_sync'), this.options.intervalMs ?? 1000 * 60 * 20);
    safeFireAndForget(this.runOnce(playlistId), 'm3u_background_sync');
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
      await this.engine.checkSource(playlistId);
      await this.engine.loadCategories({ playlistId, limit: 250 });
      const cachedIds = await this.cache.getCachedCategoryIds(playlistId);
      for (const categoryId of cachedIds.slice(0, this.options.maxCachedCategoriesPerCycle ?? 6)) {
        await this.engine.refreshCachedCategory(playlistId, categoryId);
      }
      this.patch('idle');
    } catch {
      this.patch('error');
    } finally {
      this.running = false;
    }
  }

  getStatus(): M3USyncStatus {
    return this.status;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  private patch(status: M3USyncStatus) {
    this.status = status;
    this.listeners.forEach((listener) => listener(status));
  }
}
