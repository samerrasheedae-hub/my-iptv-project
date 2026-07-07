import { useXtreamRuntime } from '@/providers/XtreamRuntimeProvider';
import { XtreamContentKind, XtreamStreamSummary } from '@/xtream/types';
import { useCallback, useEffect, useState } from 'react';

interface UseXtreamCategoryStreamsInput {
  playlistId?: string;
  categoryId?: string;
  kind?: XtreamContentKind;
  pageSize?: number;
}

interface StreamPageState {
  items: XtreamStreamSummary[];
  nextCursor?: string;
  isLoading: boolean;
  isLoadingMore: boolean;
  error?: Error;
}

const DEFAULT_PAGE_SIZE = 50;

export function useXtreamCategoryStreams({ playlistId, categoryId, kind, pageSize = DEFAULT_PAGE_SIZE }: UseXtreamCategoryStreamsInput) {
  const { container } = useXtreamRuntime();
  const [state, setState] = useState<StreamPageState>({ items: [], isLoading: true, isLoadingMore: false });

  const loadFirstPage = useCallback(async () => {
    if (!playlistId || !categoryId || !kind) {
      setState({ items: [], isLoading: false, isLoadingMore: false, error: new Error('Missing category information.') });
      return;
    }

    setState((current) => ({ ...current, isLoading: current.items.length === 0, error: undefined }));
    try {
      const page = await container.repository.listStreamsByCategory({ playlistId, categoryId, kind, limit: pageSize });
      setState({ items: page.items, nextCursor: page.nextCursor, isLoading: false, isLoadingMore: false });
    } catch (error) {
      setState((current) => ({ ...current, isLoading: false, isLoadingMore: false, error: error instanceof Error ? error : new Error('Unable to load category streams.') }));
    }
  }, [categoryId, container, kind, pageSize, playlistId]);

  const loadMore = useCallback(async () => {
    if (!playlistId || !categoryId || !kind || !state.nextCursor || state.isLoadingMore) return;

    setState((current) => ({ ...current, isLoadingMore: true, error: undefined }));
    try {
      const page = await container.repository.listStreamsByCategory({ playlistId, categoryId, kind, limit: pageSize, cursor: state.nextCursor });
      setState((current) => {
        const existing = new Set(current.items.map((item) => item.id));
        return {
          items: [...current.items, ...page.items.filter((item) => !existing.has(item.id))],
          nextCursor: page.nextCursor,
          isLoading: false,
          isLoadingMore: false,
        };
      });
    } catch (error) {
      setState((current) => ({ ...current, isLoadingMore: false, error: error instanceof Error ? error : new Error('Unable to load more streams.') }));
    }
  }, [categoryId, container, kind, pageSize, playlistId, state.isLoadingMore, state.nextCursor]);

  const refresh = useCallback(async () => {
    if (!playlistId || !categoryId || !kind) return;
    setState((current) => ({ ...current, isLoading: current.items.length === 0, error: undefined }));
    try {
      const page = await container.repository.listStreamsByCategory({ playlistId, categoryId, kind, limit: pageSize, forceRefresh: true });
      setState({ items: page.items, nextCursor: page.nextCursor, isLoading: false, isLoadingMore: false });
    } catch (error) {
      setState((current) => ({ ...current, isLoading: false, isLoadingMore: false, error: error instanceof Error ? error : new Error('Unable to refresh streams.') }));
    }
  }, [categoryId, container, kind, pageSize, playlistId]);

  useEffect(() => {
    setState({ items: [], isLoading: true, isLoadingMore: false });
    void loadFirstPage();
  }, [loadFirstPage]);

  return { ...state, loadMore, refresh, hasMore: Boolean(state.nextCursor) };
}
