import { colors, radius, typography } from '@/design/tokens';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';

export function SettingsRow({ 
  icon, 
  title, 
  subtitle,
  onPress,
  rightText,
  danger
}: { 
  icon: keyof typeof Ionicons.glyphMap; 
  title: string; 
  subtitle: string;
  onPress?: () => void;
  rightText?: string;
  danger?: boolean;
}) {
  return (
    <AnimatedPressable 
      style={[styles.row, danger && styles.dangerRow]} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.icon}><Ionicons name={icon} size={21} color={danger ? '#ff6b6b' : colors.text} /></View>
      <View style={styles.copy}>
        <Text style={[styles.title, danger && { color: '#ff6b6b' }]}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {rightText ? (
        <Text style={styles.rightText}>{rightText}</Text>
      ) : null}
      <Ionicons name="chevron-forward" size={20} color={danger ? '#ff6b6b' : colors.textSubtle} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16, marginBottom: 12 },
  dangerRow: { borderColor: '#3a2020', backgroundColor: '#1a1212' },
  icon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft },
  copy: { flex: 1 },
  title: { color: colors.text, fontWeight: '900', fontSize: typography.body },
  subtitle: { color: colors.textMuted, fontWeight: '600', fontSize: typography.caption, marginTop: 3 },
  rightText: { color: colors.primary, fontSize: 12, fontWeight: '800', marginRight: 4 },
});
