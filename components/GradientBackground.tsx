import { colors } from '@/design/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

export function GradientBackground() {
  return (
    <LinearGradient
      colors={['#18050A', colors.background, '#070711']}
      locations={[0, 0.42, 1]}
      style={StyleSheet.absoluteFillObject}
    />
  );
}
