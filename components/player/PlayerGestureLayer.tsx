import { safeFireAndForget } from '@/stability/safeFireAndForget';
import { PlayerController } from '@/player/PlayerController';
import { PlayerState } from '@/player/types';
import { PropsWithChildren, useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';

interface Props extends PropsWithChildren {
  controller: PlayerController;
  state: PlayerState;
  onSingleTap: () => void;
}

export function PlayerGestureLayer({ controller, state, onSingleTap, children }: Props) {
  const lastLeftTap = useRef(0);
  const lastRightTap = useRef(0);

  const handleTap = (side: 'left' | 'right') => {
    const now = Date.now();
    const ref = side === 'left' ? lastLeftTap : lastRightTap;
    if (now - ref.current < 280 && !state.isLive) {
      safeFireAndForget(controller.seekBy(side === 'left' ? -10 : 10), 'player_double_tap_seek');
      ref.current = 0;
      return;
    }
    ref.current = now;
    setTimeout(() => {
      if (Date.now() - ref.current >= 260) onSingleTap();
    }, 270);
  };

  const leftGesture = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 8,
    onPanResponderRelease: (_, gesture) => {
      if (Math.abs(gesture.dy) < 8) handleTap('left');
    },
    onPanResponderMove: (_, gesture) => {
      const delta = -gesture.dy / 520;
      safeFireAndForget(controller.setBrightness(state.brightness + delta), 'player_brightness_gesture');
    },
  }), [controller, state.brightness]);

  const rightGesture = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 8,
    onPanResponderRelease: (_, gesture) => {
      if (Math.abs(gesture.dy) < 8) handleTap('right');
    },
    onPanResponderMove: (_, gesture) => {
      const delta = -gesture.dy / 520;
      safeFireAndForget(controller.setVolume(state.volume + delta), 'player_volume_gesture');
    },
  }), [controller, state.volume]);

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {children}
      {!state.isLocked ? (
        <View style={styles.tapZones} pointerEvents="box-none">
          <View style={styles.zone} {...leftGesture.panHandlers} />
          <View style={styles.zone} {...rightGesture.panHandlers} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tapZones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row' },
  zone: { flex: 1 },
});
