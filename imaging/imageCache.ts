import { Image } from 'expo-image';

export type ImageCachePolicy = 'none' | 'disk' | 'memory' | 'memory-disk';

export interface ImagePrefetchOptions {
  cachePolicy?: Exclude<ImageCachePolicy, 'none'>;
  priority?: 'low' | 'normal' | 'high';
}

const DEFAULT_POLICY: Exclude<ImageCachePolicy, 'none'> = 'memory-disk';
const MAX_SUCCESSFUL_IMAGES = 1200;
const MAX_FAILED_IMAGES = 300;

class ImageMemoryRegistry {
  private readonly successful = new Set<string>();
  private readonly failed = new Map<string, { count: number; lastFailedAt: number }>();
  private readonly inFlight = new Map<string, Promise<boolean>>();

  has(uri?: string) {
    return Boolean(uri && this.successful.has(uri));
  }

  markLoaded(uri?: string) {
    if (!uri) return;
    this.successful.add(uri);
    this.failed.delete(uri);
    this.trimSuccessful();
  }

  markFailed(uri?: string) {
    if (!uri) return;
    const current = this.failed.get(uri);
    this.failed.set(uri, { count: (current?.count ?? 0) + 1, lastFailedAt: Date.now() });
    this.trimFailed();
  }

  failureCount(uri?: string) {
    return uri ? this.failed.get(uri)?.count ?? 0 : 0;
  }

  async prefetch(uri?: string, options: ImagePrefetchOptions = {}) {
    if (!uri) return false;
    if (this.successful.has(uri)) return true;
    const failure = this.failed.get(uri);
    if (failure && failure.count >= 3 && Date.now() - failure.lastFailedAt < 1000 * 60 * 5) return false;
    const existing = this.inFlight.get(uri);
    if (existing) return existing;

    const task = Image.prefetch(uri, options.cachePolicy ?? DEFAULT_POLICY)
      .then((success) => {
        if (success) this.markLoaded(uri);
        else this.markFailed(uri);
        return Boolean(success);
      })
      .catch(() => {
        this.markFailed(uri);
        return false;
      })
      .finally(() => {
        this.inFlight.delete(uri);
      });

    this.inFlight.set(uri, task);
    return task;
  }

  private trimSuccessful() {
    while (this.successful.size > MAX_SUCCESSFUL_IMAGES) {
      const oldest = this.successful.values().next().value as string | undefined;
      if (!oldest) break;
      this.successful.delete(oldest);
    }
  }

  private trimFailed() {
    while (this.failed.size > MAX_FAILED_IMAGES) {
      const oldest = this.failed.keys().next().value as string | undefined;
      if (!oldest) break;
      this.failed.delete(oldest);
    }
  }

  prefetchMany(uris: Array<string | undefined>, options?: ImagePrefetchOptions) {
    const unique = [...new Set(uris.filter(Boolean) as string[])];
    return Promise.all(unique.map((uri) => this.prefetch(uri, options)));
  }
}

export const imageMemoryCache = new ImageMemoryRegistry();
