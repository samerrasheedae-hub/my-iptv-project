import { AnimatedPressable } from '@/components/AnimatedPressable';
import { colors, radius, typography } from '@/design/tokens';
import { safeFireAndForget } from '@/stability/safeFireAndForget';
import { useAutoHideControls } from '@/player/hooks/useAutoHideControls';
import { usePlayerController } from '@/player/hooks/usePlayerController';
import { PlayerRouteContext } from '@/player/routeParams';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Skeleton } from '@/components/Skeleton';
import { Animated, LayoutAnimation, Platform, StyleSheet, Text, UIManager, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlayerControlsOverlay } from './PlayerControlsOverlay';
import { PlayerGestureLayer } from './PlayerGestureLayer';
import { VideoSurface } from './VideoSurface';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function PremiumPlayer({ mediaId, routeContext }: { mediaId: string; routeContext?: PlayerRouteContext }) {
  const { controller, session, state, isLoading, error } = usePlayerController(mediaId, routeContext);
  const controls = useAutoHideControls(Boolean(state?.isPlaying && !state?.isLocked));

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [state?.isFullscreen]);

  if (isLoading || !session || !state) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingState}>
          <Skeleton style={styles.loadingSkeleton} />
          <Text style={styles.loadingTitle}>Preparing player</Text>
          <Text style={styles.loadingSubtitle}>Loading media session, tracks, resume position, and controls.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingState}>
          <Ionicons name="warning" size={44} color={colors.primary} />
          <Text style={styles.loadingTitle}>Unable to open player</Text>
          <Text style={styles.loadingSubtitle}>{error}</Text>
          <AnimatedPressable style={styles.recoverButton} onPress={() => router.back()}>
            <Text style={styles.recoverText}>Go Back</Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={state.isFullscreen ? [] : ['top']}>
      <Animated.View style={[styles.playerShell, state.isFullscreen ? styles.fullscreenShell : styles.portraitShell]}>
        <VideoSurface session={session} state={state} engine={controller.getEngine()} />
        <PlayerGestureLayer controller={controller} state={state} onSingleTap={controls.show}>
          <PlayerControlsOverlay controller={controller} session={session} state={state} visible={controls.visible} />
        </PlayerGestureLayer>
        {state.isLocked ? (
          <AnimatedPressable style={styles.unlockButton} onPress={() => safeFireAndForget(controller.toggleLock(), 'player_unlock')}>
            <Ionicons name="lock-closed" size={24} color={colors.text} />
            <Text style={styles.unlockText}>Unlock</Text>
          </AnimatedPressable>
        ) : null}
      </Animated.View>
      {!state.isFullscreen ? (
        <View style={styles.metadataPanel}>
          <Text style={styles.badge}>{session.mode === 'live' ? 'Live TV Mode' : session.mode === 'series' ? 'Series Mode' : 'Movie Mode'}</Text>
          <Text style={styles.title}>{session.content.title}</Text>
          <Text style={styles.description}>{session.content.overview}</Text>
          <View style={styles.architectureRow}>
            {['Resume', 'Tracks', 'Subtitles', 'Casting', 'Mini Player'].map((item) => <Text key={item} style={styles.architecturePill}>{item}</Text>)}
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  playerShell: { overflow: 'hidden', backgroundColor: '#000' },
  portraitShell: { height: 520, margin: 14, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border },
  fullscreenShell: { flex: 1, margin: 0, borderRadius: 0 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 26 },
  loadingSkeleton: { width: 96, height: 96, borderRadius: radius.full },
  loadingTitle: { color: colors.text, fontSize: typography.h2, fontWeight: '900', marginTop: 18, textAlign: 'center' },
  loadingSubtitle: { color: colors.textMuted, fontSize: typography.body, textAlign: 'center', lineHeight: 22, marginTop: 8 },
  recoverButton: { marginTop: 22, backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: 22, paddingVertical: 13 },
  recoverText: { color: colors.text, fontWeight: '900', fontSize: typography.body },
  metadataPanel: { paddingHorizontal: 22, paddingTop: 8 },
  badge: { color: colors.primary, fontSize: typography.caption, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  title: { color: colors.text, fontSize: 34, lineHeight: 38, fontWeight: '900', marginTop: 8, letterSpacing: -1 },
  description: { color: colors.textMuted, fontSize: typography.body, lineHeight: 22, marginTop: 10 },
  architectureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  architecturePill: { color: colors.text, fontSize: typography.caption, fontWeight: '800', backgroundColor: colors.surface, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: colors.border },
  unlockButton: { position: 'absolute', right: 18, top: 58, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radius.full, backgroundColor: 'rgba(0,0,0,0.62)', borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 11 },
  unlockText: { color: colors.text, fontWeight: '900', fontSize: typography.caption },
});
