import { XtreamContentKind } from '@/xtream/types';

export type PlayerProviderKind = 'xtream' | 'm3u' | 'mock';

export interface PlayerRouteContext {
  providerKind?: PlayerProviderKind;
  playlistId?: string;
  streamId?: string;
  categoryId?: string;
  mediaKind?: XtreamContentKind | 'channel' | 'movie' | 'series';
}

const isProviderKind = (value?: string): value is PlayerProviderKind =>
  value === 'xtream' || value === 'm3u' || value === 'mock';

const isMediaKind = (value?: string): value is PlayerRouteContext['mediaKind'] =>
  value === 'live' || value === 'channel' || value === 'movie' || value === 'series';

export function parsePlayerRouteContext(params: Record<string, string | undefined>): PlayerRouteContext {
  return {
    providerKind: isProviderKind(params.providerKind) ? params.providerKind : undefined,
    playlistId: params.playlistId,
    streamId: params.streamId,
    categoryId: params.categoryId,
    mediaKind: isMediaKind(params.mediaKind) ? params.mediaKind : undefined,
  };
}
