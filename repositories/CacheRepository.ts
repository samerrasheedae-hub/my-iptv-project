import { Page, PageRequest } from './common';

export type CacheState = 'fresh' | 'stale' | 'miss';

export interface CachePolicy {
  ttlMs: number;
  staleWhileRevalidateMs?: number;
}

export interface CacheScope {
  playlistId?: string;
}

export interface CacheRecord<T> {
  key: string;
  namespace: string;
  playlistId?: string;
  value: T;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  staleAt?: string;
}

export interface CacheReadResult<T> {
  value?: T;
  record?: CacheRecord<T>;
  state: CacheState;
  isStale: boolean;
}

export interface CacheRefreshOptions<T> extends CacheScope {
  namespace: string;
  key: string;
  policy: CachePolicy;
  loader: () => Promise<T>;
  forceRefresh?: boolean;
}

export interface CacheRepository {
  get<T>(namespace: string, key: string, scope?: CacheScope): Promise<T | undefined>;
  getRecord<T>(namespace: string, key: string, scope?: CacheScope): Promise<CacheReadResult<T>>;
  set<T>(namespace: string, key: string, value: T, expiresAtOrPolicy?: string | CachePolicy, scope?: CacheScope): Promise<void>;
  getOrRefresh<T>(options: CacheRefreshOptions<T>): Promise<CacheReadResult<T>>;
  refresh<T>(options: CacheRefreshOptions<T>): Promise<CacheReadResult<T>>;
  remove(namespace: string, key: string, scope?: CacheScope): Promise<void>;
  clear(namespace?: string, scope?: CacheScope): Promise<void>;
  invalidatePlaylist(playlistId: string): Promise<void>;
  list<T>(namespace: string, page?: PageRequest, scope?: CacheScope): Promise<Page<CacheRecord<T>>>;
}
