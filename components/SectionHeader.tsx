import { colors, typography } from '@/design/tokens';
import { StyleSheet, Text, View } from 'react-native';

export function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {action ? <Text style={styles.action}>{action}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { color: colors.text, fontSize: typography.h3, fontWeight: '800', letterSpacing: -0.3 },
  action: { color: colors.textMuted, fontSize: typography.caption, fontWeight: '700' },
});
