import { ExpoVideoPlaybackEngineFactory } from '@/player/engine/ExpoVideoPlaybackEngine';
import { PlayerController } from '@/player/PlayerController';
import { RepositoryBackedPlayerRepository } from '@/player/repositories/RepositoryBackedPlayerRepository';
import { appConfig } from '@/config/env';
import { PlayerRouteContext } from '@/player/routeParams';
import { PlayerMediaSession, PlayerState } from '@/player/types';
import { withTimeout } from '@/stability/asyncSafety';
import { safeFireAndForget } from '@/stability/safeFireAndForget';
import { useRepositories } from '@/providers/RepositoryProvider';
import { useXtreamRuntime } from '@/providers/XtreamRuntimeProvider';
import { useEffect, useMemo, useState } from 'react';

export function usePlayerController(mediaId: string, routeContext?: PlayerRouteContext) {
  const { repositories } = useRepositories();
  const { container: xtreamContainer } = useXtreamRuntime();
  const [state, setState] = useState<PlayerState | undefined>();
  const [session, setSession] = useState<PlayerMediaSession | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const controller = useMemo(() => new PlayerController(
    mediaId,
    new RepositoryBackedPlayerRepository(repositories, xtreamContainer.repository, routeContext),
    new ExpoVideoPlaybackEngineFactory(),
  ), [mediaId, repositories, routeContext, xtreamContainer]);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = controller.subscribe((nextState) => {
      if (mounted) setState(nextState);
    });

    withTimeout(controller.initialize(), appConfig.asyncTimeoutMs)
      .then(() => {
        if (!mounted) return;
        setSession(controller.getSession());
        setState(controller.getState());
        setIsLoading(false);
      })
      .catch((initializationError: Error) => {
        if (!mounted) return;
        setError(initializationError.message);
        setIsLoading(false);
      });

    return () => {
      mounted = false;
      unsubscribe();
      safeFireAndForget(controller.destroy(), 'player_controller_destroy');
    };
  }, [controller]);

  return { controller, session, state, isLoading, error };
}
