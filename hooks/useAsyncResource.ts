import { appConfig } from '@/config/env';
import { measureAsync } from '@/monitoring/performance';
import { AppLogger } from '@/stability/AppLogger';
import { withTimeout } from '@/stability/asyncSafety';
import { useEffect, useState, type DependencyList } from 'react';

interface AsyncResource<T> {
  data: T | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
}

export function useAsyncResource<T>(loader: () => Promise<T>, dependencies: DependencyList): AsyncResource<T> {
  const [state, setState] = useState<AsyncResource<T>>({ data: null, isLoading: true, isRefreshing: false, error: null });

  useEffect(() => {
    let mounted = true;
    setState((current) => ({
      ...current,
      isLoading: current.data === null,
      isRefreshing: current.data !== null,
      error: null,
    }));

    measureAsync('useAsyncResource.loader', () => withTimeout(loader(), appConfig.asyncTimeoutMs))
      .then((data) => {
        if (mounted) setState({ data, isLoading: false, isRefreshing: false, error: null });
      })
      .catch((error: Error) => {
        AppLogger.warn('async_resource_failed', { message: error.message });
        if (mounted) setState((current) => ({ ...current, isLoading: false, isRefreshing: false, error }));
      });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return state;
}
