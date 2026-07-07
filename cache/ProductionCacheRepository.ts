import { CachePolicy, CacheReadResult, CacheRecord, CacheRefreshOptions, CacheRepository, CacheScope } from '@/repositories/CacheRepository';
import { Page, PageRequest } from '@/repositories/common';
import { CacheStore } from './CacheStore';
import { KeyedAsyncLock } from './KeyedAsyncLock';
import { cacheIdentity } from './cacheKeys';

const nowMs = () => Date.now();
const iso = (time = nowMs()) => new Date(time).toISOString();

export interface ProductionCacheRepositoryOptions {
  memoryStore: CacheStore;
  persistentStore: CacheStore;
  onBackgroundError?: (error: unknown, identity: string) => void;
}

export class ProductionCacheRepository implements CacheRepository {
  private readonly lock = new KeyedAsyncLock();
  private readonly activeRefreshes = new Set<string>();

  constructor(private readonly options: ProductionCacheRepositoryOptions) {}

  async get<T>(namespace: string, key: string, scope?: CacheScope): Promise<T | undefined> {
    return (await this.getRecord<T>(namespace, key, scope)).value;
  }

  async getRecord<T>(namespace: string, key: string, scope?: CacheScope): Promise<CacheReadResult<T>> {
    const record = await this.readThrough<T>(namespace, key, scope);
    return this.evaluate(record);
  }

  async set<T>(
    namespace: string,
    key: string,
    value: T,
    expiresAtOrPolicy?: string | CachePolicy,
    scope?: CacheScope,
  ): Promise<void> {
    const timestamp = nowMs();
    const record: CacheRecord<T> = {
      key,
      namespace,
      playlistId: scope?.playlistId,
      value,
      createdAt: iso(timestamp),
      updatedAt: iso(timestamp),
      staleAt: typeof expiresAtOrPolicy === 'object' ? iso(timestamp + expiresAtOrPolicy.ttlMs) : expiresAtOrPolicy,
      expiresAt: typeof expiresAtOrPolicy === 'object'
        ? iso(timestamp + expiresAtOrPolicy.ttlMs + (expiresAtOrPolicy.staleWhileRevalidateMs ?? 0))
        : expiresAtOrPolicy,
    };

    await this.writeBoth(record);
  }

  async getOrRefresh<T>(options: CacheRefreshOptions<T>): Promise<CacheReadResult<T>> {
    const identity = cacheIdentity(options.namespace, options.key, { playlistId: options.playlistId });
    if (options.forceRefresh) return this.refresh(options);

    const cached = await this.getRecord<T>(options.namespace, options.key, { playlistId: options.playlistId });
    if (cached.state === 'fresh') return cached;

    if (cached.state === 'stale' && cached.value !== undefined) {
      this.refreshInBackground(identity, options);
      return cached;
    }

    return this.lock.runExclusive(identity, async () => {
      const secondRead = await this.getRecord<T>(options.namespace, options.key, { playlistId: options.playlistId });
      if (secondRead.state === 'fresh') return secondRead;
      return this.refreshUnlocked(options);
    });
  }

  async refresh<T>(options: CacheRefreshOptions<T>): Promise<CacheReadResult<T>> {
    const identity = cacheIdentity(options.namespace, options.key, { playlistId: options.playlistId });
    return this.lock.runExclusive(identity, () => this.refreshUnlocked(options));
  }

  async remove(namespace: string, key: string, scope?: CacheScope): Promise<void> {
    const identity = cacheIdentity(namespace, key, scope);
    await this.lock.runExclusive(identity, async () => {
      await Promise.all([
        this.options.memoryStore.remove(namespace, key, scope),
        this.options.persistentStore.remove(namespace, key, scope),
      ]);
    });
  }

  async clear(namespace?: string, scope?: CacheScope): Promise<void> {
    await Promise.all([
      this.options.memoryStore.clear(namespace, scope),
      this.options.persistentStore.clear(namespace, scope),
    ]);
  }

  async invalidatePlaylist(playlistId: string): Promise<void> {
    await this.clear(undefined, { playlistId });
  }

  async list<T>(namespace: string, page?: PageRequest, scope?: CacheScope): Promise<Page<CacheRecord<T>>> {
    const memoryRecords = await this.options.memoryStore.list<T>(namespace, scope);
    const persistentRecords = await this.options.persistentStore.list<T>(namespace, scope);
    const byIdentity = new Map<string, CacheRecord<T>>();

    for (const record of persistentRecords) {
      byIdentity.set(cacheIdentity(record.namespace, record.key, { playlistId: record.playlistId }), record);
    }
    for (const record of memoryRecords) {
      byIdentity.set(cacheIdentity(record.namespace, record.key, { playlistId: record.playlistId }), record);
    }

    const items = [...byIdentity.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const limit = page?.limit ?? items.length;
    const offset = page?.cursor ? Number(page.cursor) : 0;
    const nextOffset = offset + limit;
    return {
      items: items.slice(offset, nextOffset),
      nextCursor: nextOffset < items.length ? String(nextOffset) : undefined,
      totalEstimate: items.length,
    };
  }

  private async refreshUnlocked<T>(options: CacheRefreshOptions<T>): Promise<CacheReadResult<T>> {
    const value = await options.loader();
    await this.set(options.namespace, options.key, value, options.policy, { playlistId: options.playlistId });
    return this.getRecord<T>(options.namespace, options.key, { playlistId: options.playlistId });
  }

  private async readThrough<T>(namespace: string, key: string, scope?: CacheScope) {
    const memoryRecord = await this.options.memoryStore.get<T>(namespace, key, scope);
    if (memoryRecord) return memoryRecord;

    const persistentRecord = await this.options.persistentStore.get<T>(namespace, key, scope);
    if (persistentRecord) await this.options.memoryStore.set(persistentRecord);
    return persistentRecord;
  }

  private async writeBoth<T>(record: CacheRecord<T>) {
    await Promise.all([
      this.options.memoryStore.set(record),
      this.options.persistentStore.set(record),
    ]);
  }

  private evaluate<T>(record?: CacheRecord<T>): CacheReadResult<T> {
    if (!record) return { state: 'miss', isStale: false };

    const time = nowMs();
    const staleAt = record.staleAt ? new Date(record.staleAt).getTime() : undefined;
    const expiresAt = record.expiresAt ? new Date(record.expiresAt).getTime() : undefined;

    if (expiresAt && time > expiresAt) return { record, state: 'miss', isStale: true };
    if (staleAt && time > staleAt) return { value: record.value, record, state: 'stale', isStale: true };
    return { value: record.value, record, state: 'fresh', isStale: false };
  }

  private refreshInBackground<T>(identity: string, options: CacheRefreshOptions<T>) {
    if (this.activeRefreshes.has(identity)) return;
    this.activeRefreshes.add(identity);
    setTimeout(() => {
      this.refresh(options)
        .catch((error) => this.options.onBackgroundError?.(error, identity))
        .finally(() => this.activeRefreshes.delete(identity));
    }, 0);
  }
}
