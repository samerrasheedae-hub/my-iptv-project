import { colors, typography } from '@/design/tokens';
import { StyleSheet, Text, View } from 'react-native';

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 4, marginBottom: 20 },
  title: { color: colors.text, fontSize: typography.h1, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { color: colors.textMuted, fontSize: typography.body, lineHeight: 21, marginTop: 6 },
});
