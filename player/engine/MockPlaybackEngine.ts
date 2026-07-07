import { PlaybackEngine, PlaybackEngineFactory, PlaybackEngineListener } from '@/player/engine/PlaybackEngine';
import { AspectRatioMode, MediaTrack, PlayerSource, PlayerState, SubtitleStyle } from '@/player/types';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const defaultSubtitleStyle: SubtitleStyle = {
  fontScale: 1,
  color: '#FFFFFF',
  backgroundColor: 'rgba(0,0,0,0.45)',
  edgeStyle: 'dropShadow',
};

export class MockPlaybackEngine implements PlaybackEngine {
  private listeners = new Set<PlaybackEngineListener>();
  private timer?: ReturnType<typeof setInterval>;
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

  async load(source: PlayerSource, initialPositionSeconds: number) {
    this.stopClock();
    this.patch({ status: 'loading', source, isLive: source.isLive, durationSeconds: source.durationSeconds ?? 0, positionSeconds: source.isLive ? 0 : initialPositionSeconds, bufferedSeconds: source.isLive ? 0 : Math.min((source.durationSeconds ?? 0), initialPositionSeconds + 20), isPlaying: false, errorMessage: undefined });
    await new Promise((resolve) => setTimeout(resolve, 450));
    this.patch({ status: 'ready' });
  }

  async play() {
    if (this.state.status === 'error') return;
    this.patch({ status: 'playing', isPlaying: true });
    this.startClock();
  }

  async pause() {
    this.patch({ status: 'paused', isPlaying: false });
    this.stopClock();
  }

  async seek(positionSeconds: number) {
    if (this.state.isLive) return;
    const position = clamp(positionSeconds, 0, this.state.durationSeconds);
    this.patch({ status: 'buffering', positionSeconds: position, bufferedSeconds: Math.min(this.state.durationSeconds, position + 18) });
    await new Promise((resolve) => setTimeout(resolve, 220));
    this.patch({ status: this.state.isPlaying ? 'playing' : 'paused' });
  }

  async seekBy(deltaSeconds: number) {
    await this.seek(this.state.positionSeconds + deltaSeconds);
  }

  async setPlaybackSpeed(speed: number) {
    this.patch({ playbackSpeed: speed });
  }

  async setAspectRatio(mode: AspectRatioMode) {
    this.patch({ aspectRatio: mode });
  }

  async setVolume(value: number) {
    this.patch({ volume: clamp(value, 0, 1) });
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
    this.patch({ status: 'buffering', errorMessage: undefined, reconnectAttempt: this.state.reconnectAttempt + 1 });
    await new Promise((resolve) => setTimeout(resolve, 500));
    this.patch({ status: this.state.isPlaying ? 'playing' : 'ready' });
  }

  async unload() {
    this.stopClock();
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

  private startClock() {
    this.stopClock();
    if (this.state.isLive) return;
    this.timer = setInterval(() => {
      const next = this.state.positionSeconds + this.state.playbackSpeed;
      if (next >= this.state.durationSeconds) {
        this.patch({ positionSeconds: this.state.durationSeconds, status: 'ended', isPlaying: false });
        this.stopClock();
        this.listeners.forEach((listener) => listener.onEnded?.());
        return;
      }
      this.patch({ positionSeconds: next, bufferedSeconds: Math.min(this.state.durationSeconds, next + 24) });
    }, 1000);
  }

  private stopClock() {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  private patch(update: Partial<PlayerState>) {
    this.state = { ...this.state, ...update };
    this.listeners.forEach((listener) => listener.onStateChange(this.state));
  }
}

export class MockPlaybackEngineFactory implements PlaybackEngineFactory {
  create(audioTracks: MediaTrack[], subtitleTracks: MediaTrack[], subtitleStyle: SubtitleStyle): PlaybackEngine {
    return new MockPlaybackEngine(audioTracks, subtitleTracks, subtitleStyle);
  }
}
