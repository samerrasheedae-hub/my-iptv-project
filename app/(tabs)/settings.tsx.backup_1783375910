import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/Screen';
import { SettingsRow } from '@/components/SettingsRow';
import { colors, radius, typography } from '@/design/tokens';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const settings = [
  { icon: 'person-circle' as const, title: 'Account', subtitle: 'Profile, subscription, and preferences' },
  { icon: 'shield-checkmark' as const, title: 'Parental Controls', subtitle: 'Ratings, PIN, and content restrictions' },
  { icon: 'cellular' as const, title: 'Streaming Quality', subtitle: 'Adaptive playback settings placeholder' },
  { icon: 'notifications' as const, title: 'Notifications', subtitle: 'New releases and live event reminders' },
  { icon: 'color-palette' as const, title: 'Appearance', subtitle: 'Theme tokens and interface density' },
];

export default function SettingsScreen() {
  return (
    <Screen padded={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <PageHeader title="Settings" subtitle="A clean settings architecture for future account, playback, and device modules." />
        <View style={styles.profileCard}>
          <View style={styles.avatar}><Ionicons name="sparkles" size={26} color={colors.text} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileTitle}>Premium Profile</Text>
            <Text style={styles.profileSubtitle}>UI shell only · backend-ready</Text>
          </View>
        </View>
        {settings.map((item) => <SettingsRow key={item.title} {...item} />)}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingBottom: 120 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 18 },
  avatar: { width: 60, height: 60, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  profileTitle: { color: colors.text, fontSize: typography.h3, fontWeight: '900' },
  profileSubtitle: { color: colors.textMuted, fontSize: typography.caption, fontWeight: '700', marginTop: 4 },
});
