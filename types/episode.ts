import { MediaImage, MediaRating, ProviderRef, StreamSourceRef } from './media';

export interface Episode {
  id: string;
  playlistId: string;
  seriesId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  provider: ProviderRef;
  images: MediaImage[];
  stream: StreamSourceRef;
  overview?: string;
  airDate?: string;
  durationSeconds?: number;
  rating?: MediaRating;
  sortTitle: string;
  searchText: string;
  createdAt: string;
  updatedAt: string;
}
