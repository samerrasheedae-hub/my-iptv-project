import { CacheScope } from '@/repositories/CacheRepository';

const GLOBAL_PLAYLIST = '__global__';

export const cacheIdentity = (namespace: string, key: string, scope?: CacheScope) =>
  `${scope?.playlistId ?? GLOBAL_PLAYLIST}:${namespace}:${key}`;

export const cacheStorageKey = (namespace: string, key: string, scope?: CacheScope) =>
  `premium_iptv_cache:${cacheIdentity(namespace, key, scope)}`;

export const parseCacheStorageKey = (storageKey: string) => {
  const prefix = 'premium_iptv_cache:';
  if (!storageKey.startsWith(prefix)) return undefined;
  const [, playlistId, namespace, ...keyParts] = storageKey.match(/^premium_iptv_cache:([^:]+):([^:]+):(.+)$/) ?? [];
  if (!playlistId || !namespace || !keyParts.length) return undefined;
  return { playlistId: playlistId === GLOBAL_PLAYLIST ? undefined : playlistId, namespace, key: keyParts.join(':') };
};
