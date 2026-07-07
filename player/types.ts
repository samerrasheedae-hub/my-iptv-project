import { ContentItem } from '@/types/content';

export type PlayerMode = 'movie' | 'series' | 'live';
export type PlaybackStatus = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'buffering' | 'ended' | 'error';
export type AspectRatioMode = 'fit' | 'fill' | 'zoom' | 'stretch';
export type CastTarget = 'chromecast' | 'airplay' | 'pip';

export interface PlayerSourceProviderRef {
  providerKind: 'xtream' | 'm3u' | 'mock';
  playlistId?: string;
  streamId?: string;
  categoryId?: string;
  mediaKind?: string;
}

export interface PlayerSource {
  id: string;
  uri: string;
  mode: PlayerMode;
  title: string;
  posterUrl?: string;
  backdropUrl?: string;
  durationSeconds?: number;
  isLive: boolean;
  provider?: PlayerSourceProviderRef;
}

export interface SeekThumbnail {
  timeSeconds: number;
  imageUrl: string;
}

export interface MediaTrack {
  id: string;
  label: string;
  language?: string;
  isDefault?: boolean;
}

export interface SubtitleStyle {
  fontScale: number;
  color: string;
  backgroundColor: string;
  edgeStyle: 'none' | 'dropShadow' | 'raised' | 'depressed' | 'outline';
}

export interface SkipIntroMarker {
  startSeconds: number;
  endSeconds: number;
  label: string;
}

export interface EpisodeNavigationItem {
  id: string;
  title: string;
  seasonNumber: number;
  episodeNumber: number;
  durationSeconds?: number;
  posterUrl?: string;
}

export interface PlayerCapabilities {
  canSeek: boolean;
  supportsThumbnails: boolean;
  supportsSkipIntro: boolean;
  supportsNextEpisode: boolean;
  supportsPreviousEpisode: boolean;
  supportsAudioTracks: boolean;
  supportsSubtitles: boolean;
  supportsPlaybackSpeed: boolean;
  supportsAspectRatio: boolean;
  supportsBrightnessGesture: boolean;
  supportsVolumeGesture: boolean;
  supportsPiP: boolean;
  supportsChromecast: boolean;
  supportsAirPlay: boolean;
  supportsMiniPlayer: boolean;
}

export interface PlayerMediaSession {
  source: PlayerSource;
  content: ContentItem;
  mode: PlayerMode;
  resumePositionSeconds: number;
  audioTracks: MediaTrack[];
  subtitleTracks: MediaTrack[];
  selectedAudioTrackId?: string;
  selectedSubtitleTrackId?: string;
  subtitleStyle: SubtitleStyle;
  playbackSpeeds: number[];
  aspectRatios: AspectRatioMode[];
  seekThumbnails: SeekThumbnail[];
  skipIntro?: SkipIntroMarker;
  previousEpisode?: EpisodeNavigationItem;
  nextEpisode?: EpisodeNavigationItem;
  episodes: EpisodeNavigationItem[];
  capabilities: PlayerCapabilities;
}

export interface PlayerState {
  status: PlaybackStatus;
  source?: PlayerSource;
  positionSeconds: number;
  durationSeconds: number;
  bufferedSeconds: number;
  isPlaying: boolean;
  isLive: boolean;
  isFullscreen: boolean;
  isLocked: boolean;
  showControls: boolean;
  volume: number;
  brightness: number;
  playbackSpeed: number;
  aspectRatio: AspectRatioMode;
  selectedAudioTrackId?: string;
  selectedSubtitleTrackId?: string;
  subtitleStyle: SubtitleStyle;
  errorMessage?: string;
  reconnectAttempt: number;
}

export interface PlayerCommandResult {
  success: boolean;
  message?: string;
}
