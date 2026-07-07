import { PlayerRepository } from '@/player/repositories/PlayerRepository';
import { PlayerRouteContext } from '@/player/routeParams';
import { PlayerCapabilities, PlayerMediaSession, PlayerMode, PlayerSource, SubtitleStyle } from '@/player/types';
import { RepositoryContainer } from '@/repositories/RepositoryContainer';
import { XtreamRepository } from '@/xtream/repositories/XtreamRepository';
import { XtreamContentKind, XtreamStreamSummary } from '@/xtream/types';
import { findContentItem } from '@/utils/contentMapper';

const defaultSubtitleStyle: SubtitleStyle = {
  fontScale: 1,
  color: '#FFFFFF',
  backgroundColor: 'rgba(0,0,0,0.45)',
  edgeStyle: 'dropShadow',
};

const capabilitiesFor = (mode: PlayerMode): PlayerCapabilities => ({
  canSeek: mode !== 'live',
  supportsThumbnails: mode !== 'live',
  supportsSkipIntro: mode === 'series',
  supportsNextEpisode: mode === 'series',
  supportsPreviousEpisode: mode === 'series',
  supportsAudioTracks: true,
  supportsSubtitles: mode !== 'live',
  supportsPlaybackSpeed: mode !== 'live',
  supportsAspectRatio: true,
  supportsBrightnessGesture: true,
  supportsVolumeGesture: true,
  supportsPiP: true,
  supportsChromecast: true,
  supportsAirPlay: true,
  supportsMiniPlayer: true,
});

export class RepositoryBackedPlayerRepository implements PlayerRepository {
  private activeSession?: PlayerMediaSession;

  constructor(
    private readonly repositories: RepositoryContainer,
    private readonly xtreamRepository?: XtreamRepository,
    private readonly routeContext?: PlayerRouteContext,
  ) {}

  async getMediaSession(mediaId: string): Promise<PlayerMediaSession | undefined> {
    if (this.routeContext?.providerKind === 'xtream') {
      const session = await this.getXtreamMediaSession(mediaId);
      this.activeSession = session;
      return session;
    }

    const content = await findContentItem(mediaId, this.repositories);
    if (!content) return undefined;

    const mode: PlayerMode = content.kind === 'live' ? 'live' : content.kind === 'series' ? 'series' : 'movie';
    const durationSeconds = mode === 'live' ? undefined : content.durationLabel?.includes('h') ? 7200 : 3600;
    const progress = await this.repositories.userLibraryRepository.getContinueWatching(mediaId);
    const source: PlayerSource = {
      id: mediaId,
      uri: `mock://${mode}/${mediaId}`,
      mode,
      title: content.title,
      posterUrl: content.posterUrl,
      backdropUrl: content.backdropUrl,
      durationSeconds,
      isLive: mode === 'live',
    };

    const episodes = mode === 'series'
      ? [1, 2, 3, 4, 5].map((episodeNumber) => ({
          id: `${mediaId}-s1-e${episodeNumber}`,
          title: `${content.title} · Episode ${episodeNumber}`,
          seasonNumber: 1,
          episodeNumber,
          durationSeconds: 2700,
          posterUrl: content.backdropUrl,
        }))
      : [];

    const session: PlayerMediaSession = {
      source,
      content,
      mode,
      resumePositionSeconds: progress?.positionSeconds ?? Math.round((content.progress ?? 0) * (durationSeconds ?? 0)),
      audioTracks: [
        { id: 'audio-auto', label: 'Auto', isDefault: true },
        { id: 'audio-en', label: 'English', language: 'en' },
        { id: 'audio-ar', label: 'Arabic', language: 'ar' },
      ],
      subtitleTracks: [
        { id: 'sub-off', label: 'Off', isDefault: true },
        { id: 'sub-en', label: 'English', language: 'en' },
        { id: 'sub-ar', label: 'Arabic', language: 'ar' },
      ],
      selectedAudioTrackId: 'audio-auto',
      selectedSubtitleTrackId: 'sub-off',
      subtitleStyle: defaultSubtitleStyle,
      playbackSpeeds: [0.5, 0.75, 1, 1.25, 1.5, 2],
      aspectRatios: ['fit', 'fill', 'zoom', 'stretch'],
      seekThumbnails: mode === 'live' ? [] : [0, 600, 1200, 1800, 2400, 3000].map((timeSeconds) => ({ timeSeconds, imageUrl: content.backdropUrl })),
      skipIntro: mode === 'series' ? { startSeconds: 12, endSeconds: 82, label: 'Skip Intro' } : undefined,
      previousEpisode: episodes[0],
      nextEpisode: episodes[1],
      episodes,
      capabilities: capabilitiesFor(mode),
    };
    this.activeSession = session;
    return session;
  }

  async saveProgress(mediaId: string, positionSeconds: number, durationSeconds: number): Promise<void> {
    if (this.routeContext?.providerKind === 'xtream' && this.activeSession && this.activeSession.mode !== 'live') {
      await this.repositories.userLibraryRepository.savePlaybackProgress({
        playlistId: this.activeSession.source.provider?.playlistId ?? this.routeContext.playlistId ?? 'xtream',
        mediaId,
        mediaKind: this.activeSession.mode === 'series' ? 'series' : 'movie',
        title: this.activeSession.content.title,
        posterUrl: this.activeSession.content.posterUrl,
        backdropUrl: this.activeSession.content.backdropUrl,
        positionSeconds,
        durationSeconds,
      });
      return;
    }

    const content = await findContentItem(mediaId, this.repositories);
    if (!content || content.kind === 'live') return;
    await this.repositories.userLibraryRepository.savePlaybackProgress({
      playlistId: 'mock-xtream-premium',
      mediaId,
      mediaKind: content.kind === 'series' ? 'series' : 'movie',
      title: content.title,
      posterUrl: content.posterUrl,
      backdropUrl: content.backdropUrl,
      positionSeconds,
      durationSeconds,
    });
  }

  private async getXtreamMediaSession(mediaId: string): Promise<PlayerMediaSession | undefined> {
    if (!this.xtreamRepository || !this.routeContext?.playlistId || !this.routeContext.categoryId) return undefined;
    const kind = this.normalizeXtreamKind(this.routeContext.mediaKind);
    if (!kind) return undefined;

    const streams = await this.xtreamRepository.listStreamsByCategory({
      playlistId: this.routeContext.playlistId,
      categoryId: this.routeContext.categoryId,
      kind,
      limit: Number.MAX_SAFE_INTEGER,
    });
    const stream = streams.items.find((item) => item.id === (this.routeContext?.streamId ?? mediaId));
    if (!stream) return undefined;

    const playbackSource = await this.xtreamRepository.resolvePlaybackSource({
      playlistId: this.routeContext.playlistId,
      streamId: stream.id,
      kind,
    });

    const mode: PlayerMode = kind === 'live' ? 'live' : kind === 'series' ? 'series' : 'movie';
    const progress = mode === 'live' ? undefined : await this.repositories.userLibraryRepository.getContinueWatching(mediaId);
    const content = this.xtreamStreamToContentItem(stream);
    const source: PlayerSource = {
      id: mediaId,
      uri: playbackSource.uri,
      mode,
      title: stream.title,
      posterUrl: stream.posterUrl,
      backdropUrl: stream.backdropUrl ?? stream.posterUrl,
      durationSeconds: mode === 'live' ? undefined : stream.durationSeconds ?? 3600,
      isLive: mode === 'live',
      provider: { providerKind: 'xtream', playlistId: this.routeContext.playlistId, streamId: stream.id, categoryId: this.routeContext.categoryId, mediaKind: kind },
    };

    return {
      source,
      content,
      mode,
      resumePositionSeconds: progress?.positionSeconds ?? 0,
      audioTracks: [{ id: 'audio-auto', label: 'Auto', isDefault: true }],
      subtitleTracks: [{ id: 'sub-off', label: 'Off', isDefault: true }],
      selectedAudioTrackId: 'audio-auto',
      selectedSubtitleTrackId: 'sub-off',
      subtitleStyle: defaultSubtitleStyle,
      playbackSpeeds: mode === 'live' ? [1] : [0.5, 0.75, 1, 1.25, 1.5, 2],
      aspectRatios: ['fit', 'fill', 'zoom', 'stretch'],
      seekThumbnails: mode === 'live' ? [] : [0, 600, 1200, 1800, 2400, 3000].map((timeSeconds) => ({ timeSeconds, imageUrl: stream.backdropUrl ?? stream.posterUrl ?? '' })).filter((item) => item.imageUrl),
      skipIntro: undefined,
      previousEpisode: undefined,
      nextEpisode: mode === 'series' ? { id: `${stream.id}:next`, title: 'Next episode', seasonNumber: 1, episodeNumber: 2, posterUrl: stream.backdropUrl ?? stream.posterUrl } : undefined,
      episodes: mode === 'series' ? [{ id: stream.id, title: stream.title, seasonNumber: 1, episodeNumber: 1, durationSeconds: stream.durationSeconds, posterUrl: stream.posterUrl }] : [],
      capabilities: capabilitiesFor(mode),
    };
  }

  private normalizeXtreamKind(kind?: PlayerRouteContext['mediaKind']): XtreamContentKind | undefined {
    if (kind === 'live' || kind === 'channel') return 'live';
    if (kind === 'movie') return 'movie';
    if (kind === 'series') return 'series';
    return undefined;
  }

  private xtreamStreamToContentItem(stream: XtreamStreamSummary) {
    return {
      id: stream.id,
      title: stream.title,
      kind: stream.kind === 'live' ? 'live' as const : stream.kind,
      posterUrl: stream.posterUrl ?? '',
      backdropUrl: stream.backdropUrl ?? stream.posterUrl ?? '',
      year: stream.releaseYear ? String(stream.releaseYear) : stream.kind === 'live' ? 'Live' : undefined,
      durationLabel: stream.durationSeconds ? `${Math.round(stream.durationSeconds / 60)}m` : stream.kind === 'live' ? 'On now' : undefined,
      maturityRating: undefined,
      progress: undefined,
      isInMyList: false,
      isDownloaded: false,
      genres: [],
      overview: `${stream.title} from Xtream ${stream.kind}.`,
    };
  }

  async clearProgress(mediaId: string): Promise<void> {
    await this.repositories.userLibraryRepository.removeContinueWatching(mediaId);
  }
}
