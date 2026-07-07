import { AVPlaybackStatus, Video } from 'expo-av';
import { PlaybackEngine, PlaybackEngineFactory, PlaybackEngineListener } from '@/player/engine/PlaybackEngine';
import { MockPlaybackEngine } from '@/player/engine/MockPlaybackEngine';
import { AspectRatioMode, MediaTrack, PlayerSource, PlayerState, SubtitleStyle } from '@/player/types';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const defaultSubtitleStyle: SubtitleStyle = {
  fontScale: 1,
  color: '#FFFFFF',
  backgroundColor: 'rgba(0,0,0,0.45)',
  edgeStyle: 'dropShadow',
};

const isPlayableRemoteUri = (uri: string) => /^https?:\/\//i.test(uri) || /^file:\/\//i.test(uri);

export class ExpoVideoPlaybackEngine implements PlaybackEngine {
  private listeners = new Set<PlaybackEngineListener>();
  private videoRef?: Video | null;
  private pendingSource?: { source: PlayerSource; initialPositionSeconds: number };
  private state: PlayerState;

  constructor(
    private readonly audioTracks: MediaTrack[],
    private readonly subtitleTracks: MediaTrack[],
    subtitleStyle: SubtitleStyle = defaultSubtitleStyle,
  ) {
    this.state = {
      status: 'idle',
      positionSeconds: 0,
      durationSeconds: 0,
      bufferedSeconds: 0,
      isPlaying: false,
      isLive: false,
      isFullscreen: false,
      isLocked: false,
      showControls: true,
      volume: 0.75,
      brightness: 0.8,
      playbackSpeed: 1,
      aspectRatio: 'fit',
      selectedAudioTrackId: audioTracks.find((track) => track.isDefault)?.id ?? audioTracks[0]?.id,
      selectedSubtitleTrackId: subtitleTracks.find((track) => track.isDefault)?.id,
      subtitleStyle,
      reconnectAttempt: 0,
    };
  }

  attachVideo(videoRef: Video | null) {
    this.videoRef = videoRef;
    if (videoRef) videoRef.setOnPlaybackStatusUpdate((status) => this.handlePlaybackStatus(status));
    if (videoRef && this.pendingSource) {
      const pending = this.pendingSource;
      this.pendingSource = undefined;
      void this.load(pending.source, pending.initialPositionSeconds);
    }
  }

  async load(source: PlayerSource, initialPositionSeconds: number) {
    this.patch({
      status: 'loading',
      source,
      isLive: source.isLive,
      durationSeconds: source.durationSeconds ?? 0,
      positionSeconds: source.isLive ? 0 : initialPositionSeconds,
      bufferedSeconds: 0,
      isPlaying: false,
      errorMessage: undefined,
    });

    if (!this.videoRef) {
      this.pendingSource = { source, initialPositionSeconds };
      return;
    }

    try {
      await this.videoRef.unloadAsync().catch(() => undefined);
      await this.videoRef.loadAsync(
        { uri: source.uri },
        {
          shouldPlay: false,
          positionMillis: source.isLive ? 0 : Math.max(0, initialPositionSeconds * 1000),
          volume: this.state.volume,
          rate: this.state.playbackSpeed,
          shouldCorrectPitch: true,
          isMuted: false,
        },
        false,
      );
      this.patch({ status: 'ready' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load video source.';
      this.patch({ status: 'error', isPlaying: false, errorMessage: message });
      this.listeners.forEach((listener) => listener.onError?.(message));
    }
  }

  async play() {
    await this.videoRef?.playAsync();
    this.patch({ status: 'playing', isPlaying: true });
  }

  async pause() {
    await this.videoRef?.pauseAsync();
    this.patch({ status: 'paused', isPlaying: false });
  }

  async seek(positionSeconds: number) {
    if (this.state.isLive) return;
    const position = clamp(positionSeconds, 0, this.state.durationSeconds || Number.MAX_SAFE_INTEGER);
    this.patch({ status: 'buffering', positionSeconds: position });
    await this.videoRef?.setPositionAsync(Math.round(position * 1000));
  }

  async seekBy(deltaSeconds: number) {
    await this.seek(this.state.positionSeconds + deltaSeconds);
  }

  async setPlaybackSpeed(speed: number) {
    await this.videoRef?.setRateAsync(speed, true);
    this.patch({ playbackSpeed: speed });
  }

  async setAspectRatio(mode: AspectRatioMode) {
    this.patch({ aspectRatio: mode });
  }

  async setVolume(value: number) {
    const volume = clamp(value, 0, 1);
    await this.videoRef?.setVolumeAsync(volume);
    this.patch({ volume });
  }

  async setBrightness(value: number) {
    this.patch({ brightness: clamp(value, 0, 1) });
  }

  async selectAudioTrack(trackId?: string) {
    if (!trackId || this.audioTracks.some((track) => track.id === trackId)) this.patch({ selectedAudioTrackId: trackId });
  }

  async selectSubtitleTrack(trackId?: string) {
    if (!trackId || this.subtitleTracks.some((track) => track.id === trackId)) this.patch({ selectedSubtitleTrackId: trackId });
  }

  async setSubtitleStyle(style: SubtitleStyle) {
    this.patch({ subtitleStyle: style });
  }

  async setFullscreen(enabled: boolean) {
    this.patch({ isFullscreen: enabled });
  }

  async setLocked(enabled: boolean) {
    this.patch({ isLocked: enabled, showControls: enabled ? false : true });
  }

  async recover() {
    const source = this.state.source;
    if (!source) return;
    this.patch({ status: 'buffering', reconnectAttempt: this.state.reconnectAttempt + 1, errorMessage: undefined });
    await this.load(source, this.state.positionSeconds);
    if (this.state.isPlaying) await this.play();
  }

  async unload() {
    await this.videoRef?.unloadAsync().catch(() => undefined);
    this.patch({ status: 'idle', isPlaying: false, source: undefined, positionSeconds: 0, durationSeconds: 0, bufferedSeconds: 0 });
  }

  getState() {
    return this.state;
  }

  subscribe(listener: PlaybackEngineListener) {
    this.listeners.add(listener);
    listener.onStateChange(this.state);
    return () => this.listeners.delete(listener);
  }

  private handlePlaybackStatus(status: AVPlaybackStatus) {
    if (!status.isLoaded) {
      this.patch({ status: 'error', isPlaying: false, errorMessage: status.error ?? 'Video playback error.' });
      if (status.error) this.listeners.forEach((listener) => listener.onError?.(status.error ?? 'Video playback error.'));
      return;
    }

    const durationSeconds = status.durationMillis ? status.durationMillis / 1000 : this.state.durationSeconds;
    const positionSeconds = status.positionMillis / 1000;
    const playable = status.playableDurationMillis ? status.playableDurationMillis / 1000 : Math.max(this.state.bufferedSeconds, positionSeconds);

    this.patch({
      status: status.isBuffering ? 'buffering' : status.didJustFinish ? 'ended' : status.isPlaying ? 'playing' : this.state.status === 'loading' ? 'ready' : 'paused',
      isPlaying: status.isPlaying,
      durationSeconds,
      positionSeconds,
      bufferedSeconds: playable,
    });

    if (status.didJustFinish) this.listeners.forEach((listener) => listener.onEnded?.());
  }

  private patch(update: Partial<PlayerState>) {
    this.state = { ...this.state, ...update };
    this.listeners.forEach((listener) => listener.onStateChange(this.state));
  }
}

class HybridPlaybackEngine implements PlaybackEngine {
  private readonly realEngine: ExpoVideoPlaybackEngine;
  private readonly mockEngine: MockPlaybackEngine;
  private active: PlaybackEngine;

  constructor(audioTracks: MediaTrack[], subtitleTracks: MediaTrack[], subtitleStyle: SubtitleStyle) {
    this.realEngine = new ExpoVideoPlaybackEngine(audioTracks, subtitleTracks, subtitleStyle);
    this.mockEngine = new MockPlaybackEngine(audioTracks, subtitleTracks, subtitleStyle);
    this.active = this.realEngine;
  }

  getVideoEngine() {
    return this.realEngine;
  }

  async load(source: PlayerSource, initialPositionSeconds: number) {
    this.active = isPlayableRemoteUri(source.uri) ? this.realEngine : this.mockEngine;
    await this.active.load(source, initialPositionSeconds);
  }

  play() { return this.active.play(); }
  pause() { return this.active.pause(); }
  seek(positionSeconds: number) { return this.active.seek(positionSeconds); }
  seekBy(deltaSeconds: number) { return this.active.seekBy(deltaSeconds); }
  setPlaybackSpeed(speed: number) { return this.active.setPlaybackSpeed(speed); }
  setAspectRatio(mode: AspectRatioMode) { return this.active.setAspectRatio(mode); }
  setVolume(value: number) { return this.active.setVolume(value); }
  setBrightness(value: number) { return this.active.setBrightness(value); }
  selectAudioTrack(trackId?: string) { return this.active.selectAudioTrack(trackId); }
  selectSubtitleTrack(trackId?: string) { return this.active.selectSubtitleTrack(trackId); }
  setSubtitleStyle(style: SubtitleStyle) { return this.active.setSubtitleStyle(style); }
  setFullscreen(enabled: boolean) { return this.active.setFullscreen(enabled); }
  setLocked(enabled: boolean) { return this.active.setLocked(enabled); }
  recover() { return this.active.recover(); }
  unload() { return this.active.unload(); }
  getState() { return this.active.getState(); }
  subscribe(listener: PlaybackEngineListener) {
    const unsubReal = this.realEngine.subscribe(listener);
    const unsubMock = this.mockEngine.subscribe(listener);
    return () => { unsubReal(); unsubMock(); };
  }
}

export class ExpoVideoPlaybackEngineFactory implements PlaybackEngineFactory {
  create(audioTracks: MediaTrack[], subtitleTracks: MediaTrack[], subtitleStyle: SubtitleStyle): PlaybackEngine {
    return new HybridPlaybackEngine(audioTracks, subtitleTracks, subtitleStyle);
  }
}

export function getExpoVideoEngine(engine?: PlaybackEngine): ExpoVideoPlaybackEngine | undefined {
  return engine && 'getVideoEngine' in engine ? (engine as HybridPlaybackEngine).getVideoEngine() : engine instanceof ExpoVideoPlaybackEngine ? engine : undefined;
}
