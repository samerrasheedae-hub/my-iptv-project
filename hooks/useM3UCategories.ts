import { useM3URuntime } from '@/providers/M3URuntimeProvider';
import { M3UCategory } from '@/m3u/types';
import { useAsyncResource } from './useAsyncResource';

export interface M3UCategoriesModel {
  categories: M3UCategory[];
  totalCount: number;
}

export function useM3UCategories() {
  const { container, source, engineState } = useM3URuntime();
  const playlistId = source?.playlistId;

  return useAsyncResource<M3UCategoriesModel>(async () => {
    if (!playlistId) return { categories: [], totalCount: 0 };
    const page = await container.repository.listCategories({ playlistId, limit: Number.MAX_SAFE_INTEGER });
    return { categories: page.items, totalCount: page.totalEstimate ?? page.items.length };
  }, [container, playlistId, engineState.updatedAt]);
}


/**
 * Task 019f – 12.2 – useM3UCategoriesV2
 * Functional connection – Service → Repository → Engine
 * Exposes: { items, loading, fromMock, error, refresh }
 * – does NOT break existing useM3UCategories() export which is used by:
 *   app/m3u/categories.tsx
 * – Keeps existing architecture intact
 * – Preserves mock/fallback mode
 * – 100k+ optimized – no full playlist download
 */
import { useCallback, useState } from 'react';

export function useM3UCategoriesV2(query?: string) {
  const { container, source, engineState } = useM3URuntime();
  const [refreshIndex, setRefreshIndex] = useState(0);

  const refresh = useCallback(() => {
    setRefreshIndex((x) => x + 1);
  }, []);

  const loader = useAsyncResource<{
    items: M3UCategory[];
    fromMock: boolean;
  }>(async () => {
    const playlistId = source?.playlistId;
    if (!playlistId) {
      return { items: [], fromMock: true };
    }

    try {
      // Prefer Service layer if available – UI → Service → Repository → Engine
      // Dynamically import to avoid circular deps and to keep existing hook untouched
      const svc = await import('@/m3u/services/M3UService');
      // Try Task 12 service contract first: listCategories(repository, playlistId, q, signal)
      if (typeof (svc as any).listCategories === 'function' && (svc as any).listCategories.length >= 2) {
        try {
          // Service layer – repository injected – keeps UI out of engine
          const res = await (svc as any).listCategories(
            container.repository,
            playlistId,
            query,
            undefined
          );
          // res: { data, fromMock }
          if (res && Array.isArray(res.data)) {
            return { items: res.data, fromMock: !!res.fromMock };
          }
        } catch {}
      }

      // Fallback to existing repository path – preserves backward compatibility
      // – with 4500ms timeout guard – no full playlist download
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeout = controller ? setTimeout(() => controller.abort(), 4500) : null;
      try {
        const page = await container.repository.listCategories({
          playlistId,
          limit: 500, // 100k+ safety – category list paginated, never full dump
          signal: controller?.signal,
        });
        if (timeout) clearTimeout(timeout);
        return { items: page.items ?? [], fromMock: false };
      } catch (e) {
        if (timeout) clearTimeout(timeout);
        // mock/fallback preserved
        return { items: [], fromMock: true };
      }
    } catch (e: any) {
      return { items: [], fromMock: true };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container, source?.playlistId, engineState.updatedAt, query, refreshIndex]);

  return {
    items: loader.data?.items ?? [],
    loading: loader.isLoading ?? false,
    fromMock: loader.data?.fromMock ?? true,
    error: loader.error ? String((loader.error as any)?.message || loader.error) : undefined,
    refresh,
  };
}

// Re-export original hook name untouched – ensures existing UI (app/m3u/categories.tsx) keeps working
// useM3UCategories already exported above – do not modify
