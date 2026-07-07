import { imageMemoryCache, ImagePrefetchOptions } from '@/imaging/imageCache';
import { useCallback } from 'react';

export function useImagePrefetch(options?: ImagePrefetchOptions) {
  return useCallback((uris: Array<string | undefined>) => {
    void imageMemoryCache.prefetchMany(uris, options);
  }, [options]);
}
