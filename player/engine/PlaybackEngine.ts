import { AspectRatioMode, MediaTrack, PlayerSource, PlayerState, SubtitleStyle } from '@/player/types';

export interface PlaybackEngineListener {
  onStateChange(state: PlayerState): void;
  onEnded?(): void;
  onError?(message: string): void;
}

export interface PlaybackEngine {
  load(source: PlayerSource, initialPositionSeconds: number): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  seek(positionSeconds: number): Promise<void>;
  seekBy(deltaSeconds: number): Promise<void>;
  setPlaybackSpeed(speed: number): Promise<void>;
  setAspectRatio(mode: AspectRatioMode): Promise<void>;
  setVolume(value: number): Promise<void>;
  setBrightness(value: number): Promise<void>;
  selectAudioTrack(trackId?: string): Promise<void>;
  selectSubtitleTrack(trackId?: string): Promise<void>;
  setSubtitleStyle(style: SubtitleStyle): Promise<void>;
  setFullscreen(enabled: boolean): Promise<void>;
  setLocked(enabled: boolean): Promise<void>;
  recover(): Promise<void>;
  unload(): Promise<void>;
  getState(): PlayerState;
  subscribe(listener: PlaybackEngineListener): () => void;
}

export interface PlaybackEngineFactory {
  create(audioTracks: MediaTrack[], subtitleTracks: MediaTrack[], subtitleStyle: SubtitleStyle): PlaybackEngine;
}
