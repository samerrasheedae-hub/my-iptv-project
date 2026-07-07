import { safeFireAndForget } from '@/stability/safeFireAndForget';
import { createXtreamEngineContainer, XtreamEngineContainer } from '@/xtream/createXtreamEngine';
import { SecureXtreamAccountStore, StoredXtreamAccount, XtreamAccountStore } from '@/xtream/storage/XtreamAccountStore';
import { XtreamAccountInfo, XtreamEngineState, XtreamSession } from '@/xtream/types';
import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

interface XtreamLoginCredentials {
  serverUrl: string;
  username: string;
  password: string;
}

interface XtreamRuntimeContextValue {
  container: XtreamEngineContainer;
  accountStore: XtreamAccountStore;
  engineState: XtreamEngineState;
  storedAccount?: StoredXtreamAccount;
  session?: XtreamSession;
  account?: XtreamAccountInfo;
  isAuthenticated: boolean;
  isRestoring: boolean;
  isAuthenticating: boolean;
  error?: string;
  authenticate(values: XtreamLoginCredentials): Promise<void>;
  restoreSession(): Promise<void>;
  logout(): Promise<void>;
}

const XtreamRuntimeContext = createContext<XtreamRuntimeContextValue | null>(null);

const playlistIdFor = (serverUrl: string, username: string) => {
  const normalized = `${serverUrl}-${username}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `xtream-${normalized || 'account'}`;
};

const friendlyError = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unable to connect Xtream account.';
  if (message.toLowerCase().includes('failed with status 401')) return 'Invalid Xtream username or password.';
  if (message.toLowerCase().includes('network')) return 'Network error. Check the server URL and your connection.';
  if (message.toLowerCase().includes('timeout')) return 'Connection timed out. Check the server URL and try again.';
  return message;
};

export function XtreamRuntimeProvider({ children }: PropsWithChildren) {
  const containerRef = useRef<XtreamEngineContainer | null>(null);
  const accountStore = useMemo(() => new SecureXtreamAccountStore(), []);
  const [engineState, setEngineState] = useState<XtreamEngineState>({ syncStatus: 'idle', cachedCategoryIds: [], updatedAt: new Date().toISOString() });
  const [storedAccount, setStoredAccount] = useState<StoredXtreamAccount | undefined>();
  const [isRestoring, setIsRestoring] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | undefined>();

  if (!containerRef.current) containerRef.current = createXtreamEngineContainer();
  const container = containerRef.current;

  const restoreSession = async () => {
    setIsRestoring(true);
    setError(undefined);
    try {
      const credentials = await accountStore.getCredentials();
      if (!credentials) {
        setStoredAccount(await accountStore.getAccount());
        return;
      }

      setStoredAccount(credentials);
      await container.repository.authenticate({
        playlistId: credentials.playlistId,
        serverUrlRef: credentials.serverUrl,
        username: credentials.username,
        passwordRef: credentials.password,
      });
      const state = container.repository.getEngineState();
      setEngineState(state);
      await accountStore.saveCredentials({
        playlistId: credentials.playlistId,
        serverUrl: credentials.serverUrl,
        username: credentials.username,
        password: credentials.password,
        session: state.session ?? credentials.session,
        account: state.account ?? credentials.account,
      });
      setStoredAccount(await accountStore.getAccount());
    } catch (restoreError) {
      setError(friendlyError(restoreError));
    } finally {
      setIsRestoring(false);
    }
  };

  useEffect(() => {
    const unsubscribe = container.engine.subscribe(setEngineState);
    safeFireAndForget(restoreSession(), 'xtream_restore_session');
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container]);

  const authenticate = async (values: XtreamLoginCredentials) => {
    setIsAuthenticating(true);
    setError(undefined);
    try {
      const playlistId = playlistIdFor(values.serverUrl, values.username);
      await container.cache.invalidatePlaylist(playlistId);
      await container.repository.authenticate({
        playlistId,
        serverUrlRef: values.serverUrl,
        username: values.username,
        passwordRef: values.password,
      });
      const state = container.repository.getEngineState();
      await accountStore.saveCredentials({
        playlistId,
        serverUrl: values.serverUrl,
        username: values.username,
        password: values.password,
        session: state.session,
        account: state.account,
      });
      setStoredAccount(await accountStore.getAccount());
      setEngineState(state);
    } catch (authError) {
      const next = friendlyError(authError);
      setError(next);
      throw new Error(next);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = async () => {
    container.repository.cancelRequests();
    container.repository.stopBackgroundSync();
    await accountStore.clear();
    setStoredAccount(undefined);
    setError(undefined);
  };

  return (
    <XtreamRuntimeContext.Provider
      value={{
        container,
        accountStore,
        engineState,
        storedAccount,
        session: engineState.session ?? storedAccount?.session,
        account: engineState.account ?? storedAccount?.account,
        isAuthenticated: Boolean(engineState.session ?? storedAccount?.session),
        isRestoring,
        isAuthenticating,
        error,
        authenticate,
        restoreSession,
        logout,
      }}
    >
      {children}
    </XtreamRuntimeContext.Provider>
  );
}

export function useXtreamRuntime() {
  const context = useContext(XtreamRuntimeContext);
  if (!context) throw new Error('useXtreamRuntime must be used inside XtreamRuntimeProvider');
  return context;
}
