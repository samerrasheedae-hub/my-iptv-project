import { AnimatedPressable } from '@/components/AnimatedPressable';
import { colors, radius, typography } from '@/design/tokens';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, ViewStyle } from 'react-native';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function PlayerActionButton({ icon, label, onPress, style }: Props) {
  return (
    <AnimatedPressable style={[styles.button, style]} onPress={onPress}>
      <Ionicons name={icon} size={22} color={colors.text} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: { minWidth: 48, height: 48, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, flexDirection: 'row', gap: 7, borderWidth: 1, borderColor: colors.border },
  label: { color: colors.text, fontSize: typography.caption, fontWeight: '900' },
});
