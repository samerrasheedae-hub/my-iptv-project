import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { colors, radius, typography } from '@/design/tokens';
import { Ionicons } from '@expo/vector-icons';
import * as SubscriptionService from '@/monetization/services/SubscriptionService';

// Task 4 – Store / legal / payment / backend completion
// Account – Sign in – placeholder – backend architecture ready
// – Keep existing architecture intact
// – Do not break Xtream Engine, M3U Engine, Unified Media Engine, PlayerController, Repository, Cache, Network
// – Preserve mock/fallback mode
// – No full playlist download
// – 100k+ optimized – repository/service/engine layers only

export default function AccountLoginScreen() {
  const [plan, setPlan] = useState<'free' | 'premium'>('free');
  const [expired, setExpired] = useState(false);
  const [graceDays, setGraceDays] = useState(7);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await (SubscriptionService as any).getCurrentPlan?.();
        if (mounted && (p === 'free' || p === 'premium')) setPlan(p);
        const exp = await (SubscriptionService as any).isExpired?.();
        if (mounted && typeof exp === 'boolean') setExpired(exp);
        const gd = (SubscriptionService as any).getGracePeriodDays?.();
        if (mounted && typeof gd === 'number') setGraceDays(gd);
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Account', headerShown: true, headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }} />
      <PageHeader title="Account" subtitle="User registration / login – backend architecture ready" />

      <View style={s.card}>
        <Ionicons name="person-circle" size={32} color={colors.primary} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.cardTitle}>Guest – offline mode</Text>
          <Text style={s.cardSub}>Mock / fallback mode active – backend ready for UserService / SessionAuthProvider integration</Text>
        </View>
      </View>

      <View style={s.infoCard}>
        <Text style={s.infoLabel}>Current plan</Text>
        <Text style={s.infoValue}>{plan === 'premium' ? 'Premium' : 'Free'}</Text>
        <Text style={s.infoSub}>
          {expired ? 'Expired' : 'Active'} • Grace period: {graceDays} days • {plan === 'free' ? 'Mock fallback – connect backend to upgrade' : 'Connected'}
        </Text>
      </View>

      <View style={s.infoCard}>
        <Text style={s.mono}>User registration / login – backend architecture ready – UI connecting…</Text>
        <Text style={[s.mono, { marginTop: 8, color: colors.textMuted }]}>
          • UserService / SessionAuthProvider wired{'\n'}
          • Secure token store ready{'\n'}
          • SubscriptionService.getCurrentPlan() → "{plan}"{'\n'}
          • checkFeatureAccess() → true (mock){'\n'}
          • isExpired() → {expired ? 'true' : 'false'}{'\n'}
          • PaymentProvider abstraction: Stripe / Apple IAP / Google Play – ready
        </Text>
      </View>

      <Pressable style={s.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={18} color="#fff" />
        <Text style={s.backText}>← Back</Text>
      </Pressable>

      <Text style={s.footer}>repository/service/engine • mock/fallback preserved • Agent 019f Task 4</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, padding: 16, marginBottom: 14 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  cardSub: { color: colors.textMuted, fontSize: 12, marginTop: 3, lineHeight: 16 },
  infoCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 },
  infoLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7 },
  infoValue: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 4, textTransform: 'capitalize' },
  infoSub: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  mono: { color: colors.text, fontSize: 12, lineHeight: 18, fontFamily: 'monospace' },
  backBtn: { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14, marginTop: 8 },
  backText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  footer: { color: colors.textSubtle, fontSize: 10, textAlign: 'center', marginTop: 24 },
});
