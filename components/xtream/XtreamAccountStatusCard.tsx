import { colors, radius, typography } from '@/design/tokens';
import { XtreamAccountInfo, XtreamSession } from '@/xtream/types';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  account?: XtreamAccountInfo;
  session?: XtreamSession;
  username?: string;
}

export function XtreamAccountStatusCard({ account, session, username }: Props) {
  const status = account?.status ?? session?.status ?? 'unknown';
  const active = status === 'active' || status === 'authenticated';

  return (
    <View style={styles.card}>
      <View style={[styles.iconShell, active ? styles.activeIcon : styles.warningIcon]}>
        <Ionicons name={active ? 'checkmark-circle' : 'alert-circle'} size={24} color={colors.text} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{account?.username ?? username ?? 'Xtream Account'}</Text>
        <Text style={styles.subtitle}>{active ? 'Connected · Categories ready' : `Status · ${status}`}</Text>
      </View>
      {account?.expiresAt ? (
        <View style={styles.expiryPill}>
          <Text style={styles.expiryText}>Expires {new Date(account.expiresAt).toLocaleDateString()}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 18 },
  iconShell: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  activeIcon: { backgroundColor: colors.success },
  warningIcon: { backgroundColor: colors.primary },
  copy: { flex: 1 },
  title: { color: colors.text, fontSize: typography.body, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: typography.caption, fontWeight: '700', marginTop: 4 },
  expiryPill: { backgroundColor: colors.surfaceSoft, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 7 },
  expiryText: { color: colors.textMuted, fontSize: 10, fontWeight: '900' },
});
