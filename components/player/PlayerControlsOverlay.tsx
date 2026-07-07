import { AnimatedPressable } from '@/components/AnimatedPressable';
import { colors, radius, typography } from '@/design/tokens';
import { safeFireAndForget } from '@/stability/safeFireAndForget';
import { PlayerController } from '@/player/PlayerController';
import { AspectRatioMode, PlayerMediaSession, PlayerState } from '@/player/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { PlayerActionButton } from './PlayerActionButton';
import { PlayerSeekBar } from './PlayerSeekBar';
import { PlayerSelectorSheet, SelectorOption } from './PlayerSelectorSheet';

interface Props {
  controller: PlayerController;
  session: PlayerMediaSession;
  state: PlayerState;
  visible: boolean;
}

export function PlayerControlsOverlay({ controller, session, state, visible }: Props) {
  const [sheet, setSheet] = useState<'audio' | 'subtitle' | 'subtitleStyle' | 'speed' | 'aspect' | 'episodes' | undefined>();
  const opacity = visible && !state.isLocked ? 1 : 0;
  const speeds: SelectorOption<number>[] = session.playbackSpeeds.map((speed) => ({ id: speed, label: `${speed}x` }));
  const aspect: SelectorOption<string>[] = session.aspectRatios.map((id) => ({ id, label: id[0].toUpperCase() + id.slice(1) }));
  const run = (promise: Promise<unknown>, label: string) => safeFireAndForget(promise, label);

  return (
    <Animated.View pointerEvents={opacity ? 'auto' : 'none'} style={[styles.overlay, { opacity }]}>
      <View style={styles.topBar}>
        <AnimatedPressable style={styles.roundButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </AnimatedPressable>
        <View style={styles.titleWrap}>
          <Text numberOfLines={1} style={styles.title}>{session.source.title}</Text>
          <Text style={styles.subtitle}>{session.mode === 'live' ? 'Live TV' : session.mode === 'series' ? 'Series' : 'Movie'}</Text>
        </View>
        <PlayerActionButton icon={state.isLocked ? 'lock-closed' : 'lock-open'} onPress={() => run(controller.toggleLock(), 'player_toggle_lock')} />
      </View>

      <View style={styles.centerControls}>
        {!state.isLive ? <PlayerActionButton icon="play-back" onPress={() => run(controller.seekBy(-10), 'player_seek_back')} /> : null}
        <AnimatedPressable style={styles.playButton} onPress={() => run(controller.playPause(), 'player_play_pause')}>
          <Ionicons name={state.isPlaying ? 'pause' : 'play'} size={42} color={colors.background} />
        </AnimatedPressable>
        {!state.isLive ? <PlayerActionButton icon="play-forward" onPress={() => run(controller.seekBy(10), 'player_seek_forward')} /> : null}
      </View>

      <View style={styles.bottomPanel}>
        {session.skipIntro && state.positionSeconds >= session.skipIntro.startSeconds && state.positionSeconds < session.skipIntro.endSeconds ? (
          <AnimatedPressable style={styles.skipIntro} onPress={() => run(controller.skipIntro(), 'player_skip_intro')}>
            <Text style={styles.skipIntroText}>{session.skipIntro.label}</Text>
          </AnimatedPressable>
        ) : null}
        <PlayerSeekBar
          position={state.positionSeconds}
          duration={state.durationSeconds}
          buffered={state.bufferedSeconds}
          thumbnails={session.seekThumbnails}
          disabled={!session.capabilities.canSeek}
          onSeek={(seconds) => run(controller.seek(seconds), 'player_seek')}
        />
        <View style={styles.actionsRow}>
          {session.capabilities.supportsPreviousEpisode ? <PlayerActionButton icon="play-skip-back" label="Prev" onPress={() => run(controller.previousEpisode(), 'player_previous_episode')} /> : null}
          {session.capabilities.supportsNextEpisode ? <PlayerActionButton icon="play-skip-forward" label="Next" onPress={() => run(controller.nextEpisode(), 'player_next_episode')} /> : null}
          {session.episodes.length ? <PlayerActionButton icon="albums" label="Episodes" onPress={() => setSheet('episodes')} /> : null}
          <PlayerActionButton icon="volume-high" label={`${Math.round(state.volume * 100)}%`} />
          <PlayerActionButton icon="sunny" label={`${Math.round(state.brightness * 100)}%`} />
          <PlayerActionButton icon={state.isFullscreen ? 'contract' : 'expand'} label={state.isFullscreen ? 'Exit' : 'Full'} onPress={() => run(controller.setFullscreen(!state.isFullscreen), 'player_fullscreen')} />
        </View>
        <View style={styles.actionsRow}>
          <PlayerActionButton icon="language" label="Audio" onPress={() => setSheet('audio')} />
          <PlayerActionButton icon="text" label="Subtitles" onPress={() => setSheet('subtitle')} />
          <PlayerActionButton icon="color-palette" label="Style" onPress={() => setSheet('subtitleStyle')} />
          <PlayerActionButton icon="speedometer" label={`${state.playbackSpeed}x`} onPress={() => setSheet('speed')} />
          <PlayerActionButton icon="resize" label={state.aspectRatio} onPress={() => setSheet('aspect')} />
        </View>
        <View style={styles.actionsRow}>
          <PlayerActionButton icon="phone-portrait" label="Mini" onPress={() => run(controller.enterMiniPlayer(), 'player_mini')} />
          <PlayerActionButton icon="tv" label="Cast" onPress={() => run(controller.startCast('chromecast'), 'player_chromecast')} />
          <PlayerActionButton icon="airplane" label="AirPlay" onPress={() => run(controller.startCast('airplay'), 'player_airplay')} />
          <PlayerActionButton icon="copy" label="PiP" onPress={() => run(controller.startCast('pip'), 'player_pip')} />
          <PlayerActionButton icon="refresh" label="Recover" onPress={() => run(controller.recover(), 'player_recover')} />
        </View>
      </View>

      <PlayerSelectorSheet visible={sheet === 'audio'} title="Audio Track" options={session.audioTracks.map((track) => ({ id: track.id, label: track.label, subtitle: track.language }))} selectedId={state.selectedAudioTrackId} onClose={() => setSheet(undefined)} onSelect={(id) => run(controller.selectAudioTrack(id), 'player_audio_track')} />
      <PlayerSelectorSheet visible={sheet === 'subtitle'} title="Subtitles" options={session.subtitleTracks.map((track) => ({ id: track.id, label: track.label, subtitle: track.language }))} selectedId={state.selectedSubtitleTrackId ?? 'sub-off'} onClose={() => setSheet(undefined)} onSelect={(id) => run(controller.selectSubtitleTrack(id), 'player_subtitle_track')} />
      <PlayerSelectorSheet visible={sheet === 'subtitleStyle'} title="Subtitle Style" options={[
        { id: 'default', label: 'Default', subtitle: 'White text with soft shadow' },
        { id: 'large', label: 'Large', subtitle: 'Larger captions for distance viewing' },
        { id: 'contrast', label: 'High Contrast', subtitle: 'Yellow text with dark background' },
      ]} selectedId="default" onClose={() => setSheet(undefined)} onSelect={(id) => run(controller.setSubtitleStyle(id === 'large' ? { ...state.subtitleStyle, fontScale: 1.25 } : id === 'contrast' ? { ...state.subtitleStyle, color: '#FFD84D', backgroundColor: 'rgba(0,0,0,0.78)', edgeStyle: 'outline' } : { ...state.subtitleStyle, fontScale: 1, color: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.45)', edgeStyle: 'dropShadow' }), 'player_subtitle_style')} />
      <PlayerSelectorSheet visible={sheet === 'speed'} title="Playback Speed" options={speeds} selectedId={state.playbackSpeed} onClose={() => setSheet(undefined)} onSelect={(id) => run(controller.setPlaybackSpeed(id), 'player_speed')} />
      <PlayerSelectorSheet visible={sheet === 'aspect'} title="Aspect Ratio" options={aspect} selectedId={state.aspectRatio} onClose={() => setSheet(undefined)} onSelect={(id) => run(controller.setAspectRatio(id as AspectRatioMode), 'player_aspect')} />
      <PlayerSelectorSheet visible={sheet === 'episodes'} title="Episodes" options={session.episodes.map((episode) => ({ id: episode.id, label: episode.title, subtitle: `S${episode.seasonNumber}:E${episode.episodeNumber}` }))} selectedId={session.source.id} onClose={() => setSheet(undefined)} onSelect={(id) => run(controller.selectEpisode(id), 'player_episode')} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', padding: 18, backgroundColor: 'rgba(0,0,0,0.24)' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 26 },
  roundButton: { width: 48, height: 48, borderRadius: radius.full, backgroundColor: 'rgba(0,0,0,0.48)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  titleWrap: { flex: 1 },
  title: { color: colors.text, fontSize: typography.h3, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: typography.caption, fontWeight: '800', marginTop: 3 },
  centerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 26 },
  playButton: { width: 86, height: 86, borderRadius: radius.full, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  bottomPanel: { gap: 14, marginBottom: 8 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  skipIntro: { alignSelf: 'flex-end', backgroundColor: colors.text, paddingHorizontal: 18, paddingVertical: 11, borderRadius: radius.full },
  skipIntroText: { color: colors.background, fontWeight: '900', fontSize: typography.body },
});
