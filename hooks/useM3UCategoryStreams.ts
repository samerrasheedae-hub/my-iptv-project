import { useM3URuntime } from '@/providers/M3URuntimeProvider';
import { M3UStreamMetadata } from '@/m3u/types';
import { useCallback, useEffect, useState } from 'react';

interface Input {
  playlistId?: string;
  categoryId?: string;
  pageSize?: number;
}

interface State {
  items: M3UStreamMetadata[];
  nextCursor?: string;
  isLoading: boolean;
  isLoadingMore: boolean;
  error?: Error;
}

const DEFAULT_PAGE_SIZE = 50;

export function useM3UCategoryStreams({ playlistId, categoryId, pageSize = DEFAULT_PAGE_SIZE }: Input) {
  const { container } = useM3URuntime();
  const [state, setState] = useState<State>({ items: [], isLoading: true, isLoadingMore: false });

  const loadFirstPage = useCallback(async () => {
    if (!playlistId || !categoryId) {
      setState({ items: [], isLoading: false, isLoadingMore: false, error: new Error('Missing M3U category information.') });
      return;
    }
    setState((current) => ({ ...current, isLoading: current.items.length === 0, error: undefined }));
    try {
      const page = await container.repository.listStreamsByCategory({ playlistId, categoryId, limit: pageSize });
      setState({ items: page.items, nextCursor: page.nextCursor, isLoading: false, isLoadingMore: false });
    } catch (error) {
      setState((current) => ({ ...current, isLoading: false, isLoadingMore: false, error: error instanceof Error ? error : new Error('Unable to load M3U streams.') }));
    }
  }, [categoryId, container, pageSize, playlistId]);

  const loadMore = useCallback(async () => {
    if (!playlistId || !categoryId || !state.nextCursor || state.isLoadingMore) return;
    setState((current) => ({ ...current, isLoadingMore: true, error: undefined }));
    try {
      const page = await container.repository.listStreamsByCategory({ playlistId, categoryId, limit: pageSize, cursor: state.nextCursor });
      setState((current) => {
        const existing = new Set(current.items.map((item) => item.id));
        return { items: [...current.items, ...page.items.filter((item) => !existing.has(item.id))], nextCursor: page.nextCursor, isLoading: false, isLoadingMore: false };
      });
    } catch (error) {
      setState((current) => ({ ...current, isLoadingMore: false, error: error instanceof Error ? error : new Error('Unable to load more M3U streams.') }));
    }
  }, [categoryId, container, pageSize, playlistId, state.isLoadingMore, state.nextCursor]);

  const refresh = useCallback(async () => {
    if (!playlistId || !categoryId) return;
    setState((current) => ({ ...current, isLoading: current.items.length === 0, error: undefined }));
    try {
      const page = await container.repository.listStreamsByCategory({ playlistId, categoryId, limit: pageSize, forceRefresh: true });
      setState({ items: page.items, nextCursor: page.nextCursor, isLoading: false, isLoadingMore: false });
    } catch (error) {
      setState((current) => ({ ...current, isLoading: false, isLoadingMore: false, error: error instanceof Error ? error : new Error('Unable to refresh M3U streams.') }));
    }
  }, [categoryId, container, pageSize, playlistId]);

  useEffect(() => {
    setState({ items: [], isLoading: true, isLoadingMore: false });
    void loadFirstPage();
  }, [loadFirstPage]);

  return { ...state, loadMore, refresh, hasMore: Boolean(state.nextCursor) };
}
