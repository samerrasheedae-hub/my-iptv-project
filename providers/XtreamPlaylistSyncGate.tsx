import { useXtreamPlaylistSync } from '@/hooks/useXtreamPlaylistSync';
import { PropsWithChildren } from 'react';

export function XtreamPlaylistSyncGate({ children }: PropsWithChildren) {
  useXtreamPlaylistSync();
  return <>{children}</>;
}
