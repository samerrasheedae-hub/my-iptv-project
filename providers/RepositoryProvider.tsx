import { createProductionRepositoryContainer } from '@/repositories/production/createProductionRepositoryContainer';
import { RepositoryContainer } from '@/repositories/RepositoryContainer';
import { PropsWithChildren, createContext, useContext, useRef, useState } from 'react';

interface RepositoryContextValue {
  repositories: RepositoryContainer;
  version: number;
  notifyChanged: () => void;
}

const RepositoryContext = createContext<RepositoryContextValue | null>(null);

export function RepositoryProvider({ children }: PropsWithChildren) {
  const [version, setVersion] = useState(0);
  const notifyChanged = () => setVersion((current) => current + 1);
  const repositoriesRef = useRef<RepositoryContainer | null>(null);

  if (!repositoriesRef.current) {
    repositoriesRef.current = createProductionRepositoryContainer(notifyChanged);
  }

  return (
    <RepositoryContext.Provider value={{ repositories: repositoriesRef.current, version, notifyChanged }}>
      {children}
    </RepositoryContext.Provider>
  );
}

export function useRepositories() {
  const context = useContext(RepositoryContext);
  if (!context) throw new Error('useRepositories must be used inside RepositoryProvider');
  return context;
}
