import { Category } from '@/types/category';
import { Channel } from '@/types/channel';
import { Episode } from '@/types/episode';
import { Movie } from '@/types/movie';
import { Playlist } from '@/types/playlist';
import { Series } from '@/types/series';

export interface ProviderSyncSnapshot {
  playlist: Playlist;
  categories: Category[];
  channels: Channel[];
  movies: Movie[];
  series: Series[];
  episodes: Episode[];
  syncedAt: string;
}

export interface StreamingProviderAdapter {
  readonly providerName: string;
  readonly supportsIncrementalSync: boolean;
  normalizePlaylist(): Playlist;
  // Future implementations will parse/fetch provider data and map it into domain models.
  // Networking is intentionally excluded from this design-only layer.
}
