import { useEffect, useRef } from 'react';
import { useXtreamRuntime } from '@/providers/XtreamRuntimeProvider';
import { useRepositories } from '@/providers/RepositoryProvider';
import { Playlist } from '@/types/playlist';

const buildXtreamPlaylist = (playlistId: string, username: string, now: string): Playlist => ({
  id: playlistId,
  name: username,
  providerType: 'xtream',
  authKind: 'xtream_credentials',
  status: 'ready',
  capabilities: {
    supportsLive: true,
    supportsMovies: true,
    supportsSeries: true,
    supportsEpg: false,
    supportsCatchup: false,
    supportsSearch: true,
  },
  syncStats: { channelCount: 0, movieCount: 0, seriesCount: 0, episodeCount: 0, categoryCount: 0 },
  createdAt: now,
  updatedAt: now,
});

export function useXtreamPlaylistSync() {
  const { storedAccount, isAuthenticated } = useXtreamRuntime();
  const { repositories, notifyChanged } = useRepositories();
  const lastSyncedIdRef = useRef<string | null>(null);

  useEffect(() => {
    const playlistId = storedAccount?.playlistId ?? null;

    if (isAuthenticated && playlistId && playlistId !== lastSyncedIdRef.current) {
      lastSyncedIdRef.current = playlistId;
      const now = new Date().toISOString();
      const playlist = buildXtreamPlaylist(
        playlistId,
        storedAccount?.account?.username ?? storedAccount?.username ?? 'Xtream Account',
        now,
      );
      repositories.playlistRepository
        .addPlaylist(playlist)
        .then(() => repositories.playlistRepository.setActivePlaylist(playlistId))
        .then(() => notifyChanged())
        .catch(() => {});
    }

    if (!isAuthenticated && lastSyncedIdRef.current) {
      const removedId = lastSyncedIdRef.current;
      lastSyncedIdRef.current = null;
      repositories.playlistRepository
        .removePlaylist(removedId)
        .then(() => notifyChanged())
        .catch(() => {});
    }
  }, [isAuthenticated, storedAccount?.playlistId]);
}
