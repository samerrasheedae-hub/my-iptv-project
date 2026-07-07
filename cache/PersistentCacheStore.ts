import AsyncStorage from '@react-native-async-storage/async-storage';
import { CacheRecord, CacheScope } from '@/repositories/CacheRepository';
import { AppLogger } from '@/stability/AppLogger';
import { CacheStore } from './CacheStore';
import { cacheStorageKey, parseCacheStorageKey } from './cacheKeys';
import { safeFireAndForget } from '@/stability/safeFireAndForget';

/**
 * PersistentCacheStore – Task 019f – 5/6 Cache eviction limits
 * Production-ready – 100,000+ items optimized
 *
 * IMPORTANT (project rules – must NOT be broken):
 * - This is functional connection work, not architecture-only preparation
 * - Keep the existing architecture intact
 * - Do not break the existing Xtream Engine, M3U Engine, Unified Media Engine, PlayerController, Repository layer, Cache layer, or Network layer
 * - Preserve the current mock/fallback mode when no provider account is connected
 * - Do not download full playlists
 * - Keep the app optimized for 100,000+ items
 * - UI must never talk directly to Xtream, M3U, raw stream URLs, or raw playlists
 *
 * Changes vs original Arena 019f 5h build:
 * - Added maxPersistentEntries = 5000
 * - Added maxPersistentAgeMs = 24 * 60 * 60 * 1000
 * - Added meta-index tracking in AsyncStorage '__cache_meta__'
 * - On set(): background prune if over limit – fire-and-forget – never blocks UI
 * - On get(): age check – if expired > maxPersistentAgeMs → delete + return null
 * - Kept ALL public method signatures IDENTICAL:
 *   get<T>(namespace, key, scope?): Promise<CacheRecord<T> | undefined>
 *   set<T>(record: CacheRecord<T>): Promise<void>
 *   remove(...)
 *   clear(...)
 *   list(...)
 * – Ensures: Repository / Service / Player / Xtream / M3U / UnifiedMedia / Network callers still compile
 * – Stale-while-revalidate remains in ProductionCacheRepository – NOT removed
 * – KeyedAsyncLock remains in ProductionCacheRepository – NOT removed – per requirements
 */

const META_KEY = '__cache_meta__v1';
const MAX_PERSISTENT_ENTRIES = 5000;
const MAX_PERSISTENT_AGE_MS = 24 * 60 * 60 * 1000; // 24h – Task spec
const PRUNE_RATIO = 0.2; // prune oldest 20% when over limit

type MetaIndex = Record<string, number>; // storageKey -> timestamp

async function readMeta(): Promise<MetaIndex> {
  try {
    const raw = await AsyncStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function writeMeta(meta: MetaIndex): Promise<void> {
  try {
    // keep meta bounded – if meta itself grows huge, trim oldest
    const entries = Object.entries(meta);
    if (entries.length > MAX_PERSISTENT_ENTRIES * 1.5) {
      entries.sort((a, b) => a[1] - b[1]);
      const trimmed = Object.fromEntries(entries.slice(-MAX_PERSISTENT_ENTRIES));
      await AsyncStorage.setItem(META_KEY, JSON.stringify(trimmed));
      return;
    }
    await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch (e) {
    AppLogger.warn('persistent_cache_meta_write_failed', { error: String(e) });
  }
}

async function touchMetaKey(storageKey: string) {
  try {
    const meta = await readMeta();
    meta[storageKey] = Date.now();
    // do not await in hot path – fire and forget – caller decides
    await writeMeta(meta);
  } catch {}
}

async function removeMetaKeys(keys: string[]) {
  if (!keys.length) return;
  try {
    const meta = await readMeta();
    let changed = false;
    for (const k of keys) {
      if (k in meta) {
        delete meta[k];
        changed = true;
      }
    }
    if (changed) await writeMeta(meta);
  } catch {}
}

export class PersistentCacheStore implements CacheStore {
  // --- Task 5 – eviction limits – public readonly for monitoring (does not break interface) ---
  readonly maxPersistentEntries = MAX_PERSISTENT_ENTRIES;
  readonly maxPersistentAgeMs = MAX_PERSISTENT_AGE_MS;

  async get<T>(namespace: string, key: string, scope?: CacheScope): Promise<CacheRecord<T> | undefined> {
    const storageKey = cacheStorageKey(namespace, key, scope);
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      if (!raw) return undefined;
      const record = this.parseRecord<T>(raw, storageKey);
      if (!record) {
        await AsyncStorage.removeItem(storageKey).catch(() => undefined);
        await removeMetaKeys([storageKey]);
        return undefined;
      }

      // --- Task 5 – age check on get ---
      // Check record-level expiresAt first – preserve existing ProductionCacheRepository SWR semantics
      const now = Date.now();
      // 1) Honor explicit expiresAt if present (existing behavior – keep SWR intact)
      if (record.expiresAt) {
        const exp = new Date(record.expiresAt).getTime();
        if (!isNaN(exp) && now > exp) {
          // Let upper layer (ProductionCacheRepository) decide stale vs miss – 
          // but at persistent layer we still return the record – SWR lives upstairs
          // – HOWEVER Task 5 requires hard max age at cache store level:
          // “On get(): check age – if expired > maxPersistentAgeMs → delete + return null”
          // We implement BOTH: respect expiresAt AND enforce maxPersistentAgeMs as hard cap
        }
      }
      // 2) Hard max age guard – Task 5 – using updatedAt / createdAt fallback
      const updatedAtMs = record.updatedAt ? new Date(record.updatedAt).getTime() : NaN;
      const createdAtMs = record.createdAt ? new Date(record.createdAt).getTime() : NaN;
      const ageBase = !isNaN(updatedAtMs) ? updatedAtMs : !isNaN(createdAtMs) ? createdAtMs : now;
      if (now - ageBase > this.maxPersistentAgeMs) {
        await AsyncStorage.removeItem(storageKey).catch(() => undefined);
        await removeMetaKeys([storageKey]);
        return undefined;
      }

      // touch meta LRU – fire-and-forget – never block UI read
      safeFireAndForget(touchMetaKey(storageKey), 'persistent_cache_touch');
      return record;
    } catch (error) {
      AppLogger.warn('persistent_cache_get_failed', { namespace, key, error: String(error) });
      await AsyncStorage.removeItem(storageKey).catch(() => undefined);
      return undefined;
    }
  }

  async set<T>(record: CacheRecord<T>): Promise<void> {
    const storageKey = cacheStorageKey(record.namespace, record.key, { playlistId: record.playlistId });
    try {
      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify(record),
      );
      // update meta index – fire and forget – do NOT await in return path per Task spec:
      // “Prune must be async fire-and-forget – use safeFireAndForget … never block UI / await in set() return path”
      safeFireAndForget(
        (async () => {
          // update timestamp
          const meta = await readMeta();
          meta[storageKey] = Date.now();
          await writeMeta(meta);
          // then check eviction
          await this.pruneIfNeeded();
        })(),
        'persistent_cache_set_meta_prune'
      );
    } catch (error) {
      AppLogger.warn('persistent_cache_set_failed', { namespace: record.namespace, key: record.key, error: String(error) });
    }
  }

  async remove(namespace: string, key: string, scope?: CacheScope): Promise<void> {
    const storageKey = cacheStorageKey(namespace, key, scope);
    await AsyncStorage.removeItem(storageKey).catch((error) => {
      AppLogger.warn('persistent_cache_remove_failed', { namespace, key, error: String(error) });
    });
    // keep meta clean – fire and forget
    safeFireAndForget(removeMetaKeys([storageKey]), 'persistent_cache_remove_meta');
  }

  async clear(namespace?: string, scope?: CacheScope): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => {
        const parsed = parseCacheStorageKey(key);
        if (!parsed) return false;
        if (namespace && parsed.namespace !== namespace) return false;
        if (scope?.playlistId && parsed.playlistId !== scope.playlistId) return false;
        return true;
      });
      if (cacheKeys.length) {
        await AsyncStorage.multiRemove(cacheKeys);
        await removeMetaKeys(cacheKeys);
      }
      // if full clear (no namespace filter), also clear meta
      if (!namespace && !scope?.playlistId) {
        await AsyncStorage.removeItem(META_KEY).catch(()=>{});
      }
    } catch (error) {
      AppLogger.warn('persistent_cache_clear_failed', { namespace, error: String(error) });
    }
  }

  async list<T>(namespace: string, scope?: CacheScope): Promise<CacheRecord<T>[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => {
        const parsed = parseCacheStorageKey(key);
        return parsed?.namespace === namespace && (!scope?.playlistId || parsed.playlistId === scope.playlistId);
      });
      if (!cacheKeys.length) return [];
      const pairs = await AsyncStorage.multiGet(cacheKeys);
      const records: CacheRecord<T>[] = [];
      const corrupted: string[] = [];
      const now = Date.now();
      for (const [key, value] of pairs) {
        if (!value) continue;
        const record = this.parseRecord<T>(value, key);
        if (!record) { corrupted.push(key); continue; }
        // Task 5 – age filter on list – keeps 100k+ lists clean
        const updatedAtMs = record.updatedAt ? new Date(record.updatedAt).getTime() : NaN;
        const createdAtMs = record.createdAt ? new Date(record.createdAt).getTime() : NaN;
        const ageBase = !isNaN(updatedAtMs) ? updatedAtMs : !isNaN(createdAtMs) ? createdAtMs : now;
        if (now - ageBase > this.maxPersistentAgeMs) {
          corrupted.push(key); // reuse corrupted list to evict expired
          continue;
        }
        records.push(record);
      }
      if (corrupted.length) {
        // cleanup expired/corrupted in background – fire-and-forget
        safeFireAndForget(
          AsyncStorage.multiRemove(corrupted).then(()=> removeMetaKeys(corrupted)),
          'persistent_cache_list_cleanup'
        );
      }
      return records;
    } catch (error) {
      AppLogger.warn('persistent_cache_list_failed', { namespace, error: String(error) });
      return [];
    }
  }

  private parseRecord<T>(raw: string, storageKey: string): CacheRecord<T> | undefined {
    try {
      const parsed = JSON.parse(raw) as Partial<CacheRecord<T>>;
      if (!parsed || typeof parsed !== 'object' || !parsed.key || !parsed.namespace || !('value' in parsed)) {
        AppLogger.warn('persistent_cache_invalid_record', { storageKey });
        return undefined;
      }
      return parsed as CacheRecord<T>;
    } catch (error) {
      AppLogger.warn('persistent_cache_corrupted_json', { storageKey, error: String(error) });
      return undefined;
    }
  }

  /**
   * pruneIfNeeded – Task 5 – Cache eviction limits
   * – Triggered fire-and-forget after set()
   * – Never blocks UI
   * – If key count > maxPersistentEntries → prune oldest 20%
   */
  private async pruneIfNeeded(): Promise<void> {
    try {
      const meta = await readMeta();
      const entries = Object.entries(meta);
      if (entries.length <= this.maxPersistentEntries) return;

      // sort oldest first
      entries.sort((a, b) => a[1] - b[1]);
      const over = entries.length - this.maxPersistentEntries;
      // prune oldest 20% OR at least 'over' count – whichever is larger – matches spec “prune oldest 20%”
      const pruneCount = Math.max(over, Math.ceil(entries.length * PRUNE_RATIO));
      const toPrune = entries.slice(0, pruneCount);
      const keysToRemove = toPrune.map(([k]) => k);

      if (keysToRemove.length) {
        await AsyncStorage.multiRemove(keysToRemove).catch(()=>{});
        // update meta
        for (const k of keysToRemove) delete meta[k];
        await writeMeta(meta);
        AppLogger.info?.('persistent_cache_pruned', { removed: keysToRemove.length, remaining: entries.length - keysToRemove.length });
      }
    } catch (e) {
      AppLogger.warn('persistent_cache_prune_failed', { error: String(e) });
      // fail silent – never break calling code – preserve mock/fallback mode
    }
  }

  /**
   * getStats – optional – non-breaking – for monitoring
   * – matches MemoryCacheStore.getStats() shape roughly
   */
  async getStats(): Promise<{ size: number; maxEntries: number }> {
    try {
      const meta = await readMeta();
      return {
        size: Object.keys(meta).length,
        maxEntries: this.maxPersistentEntries,
      };
    } catch {
      return { size: 0, maxEntries: this.maxPersistentEntries };
    }
  }
}
