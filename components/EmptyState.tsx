import { AnimatedPressable } from '@/components/AnimatedPressable';
import { colors, radius, typography } from '@/design/tokens';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export function EmptyState({ icon, title, message, actionLabel }: { icon: keyof typeof Ionicons.glyphMap; title: string; message: string; actionLabel?: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconShell}><Ionicons name={icon} size={34} color={colors.primary} /></View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel ? <AnimatedPressable style={styles.action}><Text style={styles.actionText}>{actionLabel}</Text></AnimatedPressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 70, paddingHorizontal: 22 },
  iconShell: { width: 74, height: 74, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(229,9,20,0.12)', marginBottom: 18 },
  title: { color: colors.text, fontSize: typography.h2, fontWeight: '900', textAlign: 'center' },
  message: { color: colors.textMuted, fontSize: typography.body, lineHeight: 22, textAlign: 'center', marginTop: 8 },
  action: { marginTop: 22, backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: 22, paddingVertical: 13 },
  actionText: { color: colors.text, fontSize: typography.body, fontWeight: '900' },
});
