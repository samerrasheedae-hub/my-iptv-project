import { mockCatalogItems } from '@/data/mockContent';
import { Category } from '@/types/category';
import { Channel } from '@/types/channel';
import { Episode } from '@/types/episode';
import { MediaImage, MediaKind, MediaSummary, ProviderRef, StreamSourceRef } from '@/types/media';
import { Movie } from '@/types/movie';
import { Playlist } from '@/types/playlist';
import { Series } from '@/types/series';

const now = '2026-07-06T00:00:00.000Z';
export const XTREAM_PLAYLIST_ID = 'mock-xtream-premium';
export const M3U_PLAYLIST_ID = 'mock-m3u-live';

export const mockPlaylists: Playlist[] = [
  {
    id: XTREAM_PLAYLIST_ID,
    name: 'Premium Mock Xtream',
    providerType: 'xtream',
    authKind: 'xtream_credentials',
    status: 'ready',
    capabilities: { supportsLive: true, supportsMovies: true, supportsSeries: true, supportsEpg: true, supportsCatchup: false, supportsSearch: true },
    syncStats: { channelCount: 2, movieCount: 3, seriesCount: 2, episodeCount: 6, categoryCount: 7, lastSyncedAt: now },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: M3U_PLAYLIST_ID,
    name: 'Local Mock M3U',
    providerType: 'm3u',
    authKind: 'm3u_url',
    status: 'ready',
    capabilities: { supportsLive: true, supportsMovies: false, supportsSeries: false, supportsEpg: true, supportsCatchup: false, supportsSearch: true },
    syncStats: { channelCount: 2, movieCount: 0, seriesCount: 0, episodeCount: 0, categoryCount: 2, lastSyncedAt: now },
    createdAt: now,
    updatedAt: now,
  },
];

const titleToId = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const providerFor = (playlistId: string, externalId: string, rawCategoryId?: string): ProviderRef => ({
  providerType: playlistId === M3U_PLAYLIST_ID ? 'm3u' : 'xtream',
  playlistId,
  externalId,
  rawCategoryId,
});

const imagesFor = (posterUrl: string, backdropUrl: string): MediaImage[] => [
  { role: 'poster', url: posterUrl },
  { role: 'backdrop', url: backdropUrl },
];

const streamFor = (playlistId: string, id: string, kind: 'live' | 'vod' | 'series'): StreamSourceRef => ({
  id: `stream-${id}`,
  provider: providerFor(playlistId, id),
  kind,
  containerExtension: kind === 'live' ? 'm3u8' : 'mp4',
  qualityLabel: kind === 'live' ? '4K' : 'HD',
  isAdaptive: kind === 'live',
});

export const mockCategories: Category[] = [
  { id: 'cat-live-premium', playlistId: XTREAM_PLAYLIST_ID, title: 'Premium Live', kind: 'channel', provider: providerFor(XTREAM_PLAYLIST_ID, 'live-premium'), itemCount: 2, sortOrder: 1, createdAt: now, updatedAt: now },
  { id: 'cat-sports', playlistId: XTREAM_PLAYLIST_ID, title: 'Sports', kind: 'channel', provider: providerFor(XTREAM_PLAYLIST_ID, 'sports'), itemCount: 1, sortOrder: 2, createdAt: now, updatedAt: now },
  { id: 'cat-action', playlistId: XTREAM_PLAYLIST_ID, title: 'Action', kind: 'movie', provider: providerFor(XTREAM_PLAYLIST_ID, 'action'), itemCount: 1, sortOrder: 3, createdAt: now, updatedAt: now },
  { id: 'cat-documentary', playlistId: XTREAM_PLAYLIST_ID, title: 'Documentary', kind: 'movie', provider: providerFor(XTREAM_PLAYLIST_ID, 'documentary'), itemCount: 1, sortOrder: 4, createdAt: now, updatedAt: now },
  { id: 'cat-drama', playlistId: XTREAM_PLAYLIST_ID, title: 'Drama Series', kind: 'series', provider: providerFor(XTREAM_PLAYLIST_ID, 'drama'), itemCount: 1, sortOrder: 5, createdAt: now, updatedAt: now },
  { id: 'cat-sci-fi', playlistId: XTREAM_PLAYLIST_ID, title: 'Sci-Fi Series', kind: 'series', provider: providerFor(XTREAM_PLAYLIST_ID, 'sci-fi'), itemCount: 1, sortOrder: 6, createdAt: now, updatedAt: now },
  { id: 'cat-m3u-news', playlistId: M3U_PLAYLIST_ID, title: 'M3U News', kind: 'channel', provider: providerFor(M3U_PLAYLIST_ID, 'news'), itemCount: 1, sortOrder: 1, createdAt: now, updatedAt: now },
  { id: 'cat-m3u-entertainment', playlistId: M3U_PLAYLIST_ID, title: 'M3U Entertainment', kind: 'channel', provider: providerFor(M3U_PLAYLIST_ID, 'entertainment'), itemCount: 1, sortOrder: 2, createdAt: now, updatedAt: now },
];

const categoryIdsFor = (kind: MediaKind, genres: string[], playlistId = XTREAM_PLAYLIST_ID): string[] => {
  if (playlistId === M3U_PLAYLIST_ID) return genres.includes('News') ? ['cat-m3u-news'] : ['cat-m3u-entertainment'];
  if (kind === 'channel') return genres.includes('Sports') ? ['cat-sports'] : ['cat-live-premium'];
  if (kind === 'movie') return genres.includes('Documentary') ? ['cat-documentary'] : ['cat-action'];
  if (kind === 'series') return genres.includes('Sci-Fi') ? ['cat-sci-fi'] : ['cat-drama'];
  return [];
};

export const mockChannels: Channel[] = mockCatalogItems
  .filter((item) => item.kind === 'live')
  .map((item, index) => ({
    id: item.id,
    playlistId: XTREAM_PLAYLIST_ID,
    title: item.title,
    channelNumber: 100 + index,
    categoryIds: categoryIdsFor('channel', item.genres),
    provider: providerFor(XTREAM_PLAYLIST_ID, item.id),
    images: imagesFor(item.posterUrl, item.backdropUrl),
    stream: streamFor(XTREAM_PLAYLIST_ID, item.id, 'live'),
    currentProgram: { id: `${item.id}-program-now`, title: item.durationLabel ?? 'On now', startsAt: now, endsAt: '2026-07-06T01:00:00.000Z', progress: item.progress },
    isAdult: false,
    isLive: true,
    sortTitle: item.title.toLowerCase(),
    searchText: `${item.title} ${item.genres.join(' ')} live`.toLowerCase(),
    createdAt: now,
    updatedAt: now,
  }));

export const mockM3UChannels: Channel[] = [
  {
    id: 'm3u-world-news', playlistId: M3U_PLAYLIST_ID, title: 'World News Mock', channelNumber: 1, categoryIds: ['cat-m3u-news'], provider: providerFor(M3U_PLAYLIST_ID, 'world-news'), images: imagesFor(mockCatalogItems[0].posterUrl, mockCatalogItems[0].backdropUrl), stream: streamFor(M3U_PLAYLIST_ID, 'world-news', 'live'), isAdult: false, isLive: true, sortTitle: 'world news mock', searchText: 'world news mock m3u live', createdAt: now, updatedAt: now,
  },
  {
    id: 'm3u-cinema-one', playlistId: M3U_PLAYLIST_ID, title: 'Cinema One Mock', channelNumber: 2, categoryIds: ['cat-m3u-entertainment'], provider: providerFor(M3U_PLAYLIST_ID, 'cinema-one'), images: imagesFor(mockCatalogItems[1].posterUrl, mockCatalogItems[1].backdropUrl), stream: streamFor(M3U_PLAYLIST_ID, 'cinema-one', 'live'), isAdult: false, isLive: true, sortTitle: 'cinema one mock', searchText: 'cinema one mock entertainment m3u live', createdAt: now, updatedAt: now,
  },
];

export const mockMovies: Movie[] = mockCatalogItems
  .filter((item) => item.kind === 'movie' || item.kind === 'collection')
  .map((item) => ({
    id: item.id,
    playlistId: XTREAM_PLAYLIST_ID,
    title: item.title,
    categoryIds: categoryIdsFor('movie', item.genres),
    provider: providerFor(XTREAM_PLAYLIST_ID, item.id),
    images: imagesFor(item.posterUrl, item.backdropUrl),
    stream: streamFor(XTREAM_PLAYLIST_ID, item.id, 'vod'),
    overview: item.overview,
    releaseYear: item.year && /^\d+$/.test(item.year) ? Number(item.year) : undefined,
    durationSeconds: item.durationLabel?.includes('h') ? 7200 : 3600,
    maturityRating: item.maturityRating,
    genres: item.genres,
    rating: { source: 'provider', value: 8.2, maxValue: 10 },
    sortTitle: item.title.toLowerCase(),
    searchText: `${item.title} ${item.genres.join(' ')} ${item.overview}`.toLowerCase(),
    createdAt: now,
    updatedAt: now,
  }));

export const mockSeries: Series[] = mockCatalogItems
  .filter((item) => item.kind === 'series')
  .map((item) => ({
    id: item.id,
    playlistId: XTREAM_PLAYLIST_ID,
    title: item.title,
    categoryIds: categoryIdsFor('series', item.genres),
    provider: providerFor(XTREAM_PLAYLIST_ID, item.id),
    images: imagesFor(item.posterUrl, item.backdropUrl),
    overview: item.overview,
    releaseYear: item.year && /^\d+$/.test(item.year) ? Number(item.year) : undefined,
    maturityRating: item.maturityRating,
    genres: item.genres,
    rating: { source: 'provider', value: 8.7, maxValue: 10 },
    seasons: [{ seasonNumber: 1, title: 'Season 1', episodeCount: 3, posterUrl: item.posterUrl }],
    totalEpisodes: 3,
    status: 'returning',
    sortTitle: item.title.toLowerCase(),
    searchText: `${item.title} ${item.genres.join(' ')} ${item.overview}`.toLowerCase(),
    createdAt: now,
    updatedAt: now,
  }));

export const mockEpisodes: Episode[] = mockSeries.flatMap((series) =>
  [1, 2, 3].map((episodeNumber) => ({
    id: `${series.id}-s1-e${episodeNumber}`,
    playlistId: series.playlistId,
    seriesId: series.id,
    seasonNumber: 1,
    episodeNumber,
    title: `${series.title} E${episodeNumber}`,
    provider: providerFor(series.playlistId, `${series.id}-${episodeNumber}`),
    images: series.images,
    stream: streamFor(series.playlistId, `${series.id}-${episodeNumber}`, 'series'),
    overview: `${series.title} mock episode ${episodeNumber}.`,
    durationSeconds: 2700,
    rating: series.rating,
    sortTitle: `${series.sortTitle} ${episodeNumber}`,
    searchText: `${series.searchText} episode ${episodeNumber}`,
    createdAt: now,
    updatedAt: now,
  })),
);

export const toMediaSummary = (item: Channel | Movie | Series | Episode): MediaSummary => {
  const kind: MediaKind = 'isLive' in item ? 'channel' : 'seriesId' in item ? 'episode' : 'stream' in item ? 'movie' : 'series';
  return {
    id: item.id,
    kind,
    title: item.title,
    subtitle: kind === 'channel' ? 'Live' : kind === 'episode' ? `S${(item as Episode).seasonNumber}:E${(item as Episode).episodeNumber}` : 'releaseYear' in item && item.releaseYear ? String(item.releaseYear) : undefined,
    description: 'overview' in item ? item.overview : undefined,
    categoryIds: 'categoryIds' in item ? item.categoryIds : [],
    images: item.images,
    provider: item.provider,
    releaseYear: 'releaseYear' in item ? item.releaseYear : undefined,
    maturityRating: 'maturityRating' in item ? item.maturityRating : undefined,
    durationSeconds: 'durationSeconds' in item ? item.durationSeconds : undefined,
    genres: 'genres' in item ? item.genres : undefined,
    rating: 'rating' in item ? item.rating : undefined,
    sortTitle: item.sortTitle,
    searchText: item.searchText,
    updatedAt: item.updatedAt,
  };
};

export const allMediaSummaries = () => [
  ...mockChannels,
  ...mockMovies,
  ...mockSeries,
  ...mockEpisodes,
].map(toMediaSummary);

export const findMockContentItem = (id: string) => mockCatalogItems.find((item) => item.id === id || id.startsWith(`${item.id}-`));
