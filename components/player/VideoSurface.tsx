import { ProgressiveImage } from '@/components/images/ProgressiveImage';
import { colors, radius, typography } from '@/design/tokens';
import { PlaybackEngine } from '@/player/engine/PlaybackEngine';
import { PlayerMediaSession, PlayerState } from '@/player/types';
import { Ionicons } from '@expo/vector-icons';
import { Skeleton } from '@/components/Skeleton';
import { ExpoVideoLayer } from './ExpoVideoLayer';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  session: PlayerMediaSession;
  state: PlayerState;
  engine?: PlaybackEngine;
}

export function VideoSurface({ session, state, engine }: Props) {
  const showPoster = state.status === 'ready' || state.status === 'loading' || state.status === 'idle';
  return (
    <View style={styles.surface}>
      <ProgressiveImage uri={session.source.backdropUrl ?? session.source.posterUrl} thumbnailUri={session.source.posterUrl} style={StyleSheet.absoluteFillObject} recyclingKey={`surface-${session.source.id}`} />
      <ExpoVideoLayer engine={engine} aspectRatio={state.aspectRatio} />
      <View style={styles.dim} />
      {!showPoster ? <View style={styles.videoTint} /> : null}
      {session.mode === 'live' ? <View style={styles.liveBadge}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View> : null}
      {(state.status === 'loading' || state.status === 'buffering') ? (
        <View style={styles.centerStatus}>
          <Skeleton style={styles.bufferSkeleton} />
          <Text style={styles.statusText}>{state.status === 'loading' ? 'Loading stream' : 'Buffering'}</Text>
        </View>
      ) : null}
      {state.status === 'error' ? (
        <View style={styles.centerStatus}>
          <Ionicons name="warning" size={38} color={colors.primary} />
          <Text style={styles.statusText}>{state.errorMessage ?? 'Playback error'}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },
  videoTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.42)' },
  centerStatus: { position: 'absolute', alignSelf: 'center', top: '42%', alignItems: 'center', gap: 12 },
  bufferSkeleton: { width: 58, height: 58, borderRadius: radius.full },
  statusText: { color: colors.text, fontWeight: '900', fontSize: typography.body },
  liveBadge: { position: 'absolute', top: 22, left: 22, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.text },
  liveText: { color: colors.text, fontWeight: '900', fontSize: typography.caption },
});
