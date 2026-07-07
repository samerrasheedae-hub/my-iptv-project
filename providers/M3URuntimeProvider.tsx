import { safeFireAndForget } from '@/stability/safeFireAndForget';
import { createM3UEngineContainer, M3UEngineContainer } from '@/m3u/createM3UEngine';
import { AsyncStorageM3USourceStore, M3USourceStore } from '@/m3u/storage/M3USourceStore';
import { M3UEngineState, M3URegisterSourceInput, M3USourceDescriptor, M3USourceKind } from '@/m3u/types';
import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

interface M3UConnectInput {
  kind: M3USourceKind;
  uri: string;
  displayName: string;
  epgUri?: string;
}

interface M3URuntimeContextValue {
  container: M3UEngineContainer;
  sourceStore: M3USourceStore;
  source?: M3USourceDescriptor;
  engineState: M3UEngineState;
  isConnected: boolean;
  isRestoring: boolean;
  isRegistering: boolean;
  error?: string;
  registerSource(input: M3UConnectInput): Promise<void>;
  restoreSource(): Promise<void>;
  clearSource(): Promise<void>;
}

const M3URuntimeContext = createContext<M3URuntimeContextValue | null>(null);

const playlistIdFor = (uri: string, displayName: string) => {
  const normalized = `${displayName}-${uri}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `m3u-${normalized.slice(0, 80) || 'source'}`;
};

const friendlyError = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unable to register M3U source.';
  if (message.toLowerCase().includes('network')) return 'Network error. Check the playlist URL and your connection.';
  if (message.toLowerCase().includes('timeout')) return 'Source registration timed out. Try again.';
  return message;
};

export function M3URuntimeProvider({ children }: PropsWithChildren) {
  const containerRef = useRef<M3UEngineContainer | null>(null);
  const sourceStore = useMemo(() => new AsyncStorageM3USourceStore(), []);
  const [source, setSource] = useState<M3USourceDescriptor | undefined>();
  const [engineState, setEngineState] = useState<M3UEngineState>({ syncStatus: 'idle', cachedCategoryIds: [], updatedAt: new Date().toISOString() });
  const [isRestoring, setIsRestoring] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | undefined>();

  if (!containerRef.current) containerRef.current = createM3UEngineContainer();
  const container = containerRef.current;

  const registerWithRepository = async (input: M3URegisterSourceInput) => {
    await container.repository.registerSource(input);
    const state = container.repository.getEngineState();
    const descriptor = state.source ?? {
      playlistId: input.playlistId,
      kind: input.kind,
      uri: input.uri,
      displayName: input.displayName,
      epgUri: input.epgUri,
      headers: input.headers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await sourceStore.saveSource(descriptor);
    setSource(descriptor);
    setEngineState(state);
  };

  const restoreSource = async () => {
    setIsRestoring(true);
    setError(undefined);
    try {
      const stored = await sourceStore.getSource();
      if (!stored) return;
      setSource(stored);
      await registerWithRepository({
        playlistId: stored.playlistId,
        kind: stored.kind,
        uri: stored.uri,
        displayName: stored.displayName,
        epgUri: stored.epgUri,
        headers: stored.headers,
      });
    } catch (restoreError) {
      setError(friendlyError(restoreError));
    } finally {
      setIsRestoring(false);
    }
  };

  useEffect(() => {
    const unsubscribe = container.engine.subscribe(setEngineState);
    safeFireAndForget(restoreSource(), 'm3u_restore_source');
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container]);

  const registerSource = async (input: M3UConnectInput) => {
    setIsRegistering(true);
    setError(undefined);
    try {
      const playlistId = playlistIdFor(input.uri, input.displayName);
      await registerWithRepository({ playlistId, ...input });
    } catch (registerError) {
      const next = friendlyError(registerError);
      setError(next);
      throw new Error(next);
    } finally {
      setIsRegistering(false);
    }
  };

  const clearSource = async () => {
    container.repository.cancelRequests();
    container.repository.stopBackgroundParsing();
    await sourceStore.clear();
    setSource(undefined);
    setError(undefined);
  };

  return (
    <M3URuntimeContext.Provider value={{
      container,
      sourceStore,
      source,
      engineState,
      isConnected: Boolean(source),
      isRestoring,
      isRegistering,
      error,
      registerSource,
      restoreSource,
      clearSource,
    }}>
      {children}
    </M3URuntimeContext.Provider>
  );
}

export function useM3URuntime() {
  const context = useContext(M3URuntimeContext);
  if (!context) throw new Error('useM3URuntime must be used inside M3URuntimeProvider');
  return context;
}
