import { createUnifiedMediaEngineContainer, UnifiedMediaEngineContainer } from '@/media/createUnifiedMediaEngine';
import { PropsWithChildren, createContext, useContext, useMemo } from 'react';
import { useXtreamRuntime } from './XtreamRuntimeProvider';
import { useM3URuntime } from './M3URuntimeProvider';

interface UnifiedMediaRuntimeContextValue {
  container: UnifiedMediaEngineContainer;
}

const UnifiedMediaRuntimeContext = createContext<UnifiedMediaRuntimeContextValue | null>(null);

export function UnifiedMediaRuntimeProvider({ children }: PropsWithChildren) {
  const { container: xtreamContainer } = useXtreamRuntime();
  const { container: m3uContainer } = useM3URuntime();
  const container = useMemo(
    () => createUnifiedMediaEngineContainer({ xtreamRepository: xtreamContainer.repository, m3uRepository: m3uContainer.repository }),
    [xtreamContainer.repository, m3uContainer.repository],
  );

  return (
    <UnifiedMediaRuntimeContext.Provider value={{ container }}>
      {children}
    </UnifiedMediaRuntimeContext.Provider>
  );
}

export function useUnifiedMediaRuntime() {
  const context = useContext(UnifiedMediaRuntimeContext);
  if (!context) throw new Error('useUnifiedMediaRuntime must be used inside UnifiedMediaRuntimeProvider');
  return context;
}
