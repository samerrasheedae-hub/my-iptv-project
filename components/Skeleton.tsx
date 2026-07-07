import { colors, radius } from '@/design/tokens';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

export function Skeleton({ style }: { style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 780, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 780, useNativeDriver: true }),
      ]),
    ).start();
  }, [opacity]);

  return <Animated.View style={[styles.base, style, { opacity }]} />;
}

export function HomeSkeleton() {
  return (
    <View style={styles.home}>
      <Skeleton style={styles.hero} />
      {[0, 1, 2].map((row) => (
        <View key={row} style={styles.row}>
          <Skeleton style={styles.heading} />
          <View style={styles.posterRow}>
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} style={styles.poster} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.surfaceSoft, borderRadius: radius.md, overflow: 'hidden' },
  home: { paddingHorizontal: 18, paddingTop: 8 },
  hero: { height: 440, borderRadius: radius.xl, marginBottom: 28 },
  row: { marginBottom: 26 },
  heading: { height: 22, width: 160, marginBottom: 12 },
  posterRow: { flexDirection: 'row', gap: 12 },
  poster: { width: 132, height: 198 },
});
