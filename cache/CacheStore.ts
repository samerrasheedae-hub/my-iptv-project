import { CacheRecord, CacheScope } from '@/repositories/CacheRepository';

export interface CacheStore {
  get<T>(namespace: string, key: string, scope?: CacheScope): Promise<CacheRecord<T> | undefined>;
  set<T>(record: CacheRecord<T>): Promise<void>;
  remove(namespace: string, key: string, scope?: CacheScope): Promise<void>;
  clear(namespace?: string, scope?: CacheScope): Promise<void>;
  list<T>(namespace: string, scope?: CacheScope): Promise<CacheRecord<T>[]>;
}
