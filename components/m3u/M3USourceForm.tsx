import { AnimatedPressable } from '@/components/AnimatedPressable';
import { colors, radius, typography } from '@/design/tokens';
import { M3USourceKind } from '@/m3u/types';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export interface M3USourceFormValues {
  kind: M3USourceKind;
  uri: string;
  displayName: string;
  epgUri?: string;
}

interface Props {
  onRegister: (values: M3USourceFormValues) => Promise<void>;
  onCancel?: () => void;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

type Errors = Partial<Record<keyof M3USourceFormValues, string>>;

const isRemoteUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export function M3USourceForm({ onRegister, onCancel }: Props) {
  const [values, setValues] = useState<M3USourceFormValues>({ kind: 'remote_url', uri: '', displayName: '', epgUri: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | undefined>();

  const update = (key: keyof M3USourceFormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    if (status === 'error') {
      setStatus('idle');
      setMessage(undefined);
    }
  };

  const validate = () => {
    const next: Errors = {};
    const uri = values.uri.trim();
    if (!values.displayName.trim()) next.displayName = 'Display name is required.';
    if (!uri) next.uri = values.kind === 'remote_url' ? 'M3U URL is required.' : 'Local file URI is required.';
    else if (values.kind === 'remote_url' && !isRemoteUrl(uri)) next.uri = 'Use a valid http:// or https:// M3U URL.';
    else if (values.kind === 'local_file' && !uri.startsWith('file://')) next.uri = 'Local file architecture expects a file:// URI.';
    if (values.epgUri?.trim() && !isRemoteUrl(values.epgUri.trim())) next.epgUri = 'EPG URL must be a valid http:// or https:// URL.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (status === 'loading' || !validate()) return;
    setStatus('loading');
    setMessage(undefined);
    try {
      await onRegister({ ...values, uri: values.uri.trim(), displayName: values.displayName.trim(), epgUri: values.epgUri?.trim() || undefined });
      setStatus('success');
      setMessage('M3U source registered. Categories are indexed separately from streams.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unable to register M3U source.');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.iconShell}><Ionicons name="list" size={34} color={colors.text} /></View>
        <Text style={styles.title}>Add M3U Source</Text>
        <Text style={styles.subtitle}>Register a remote URL or local file descriptor. The UI receives structured categories and never parses the raw playlist.</Text>

        <View style={styles.toggleRow}>
          <SourceToggle label="Remote URL" active={values.kind === 'remote_url'} onPress={() => setValues((current) => ({ ...current, kind: 'remote_url', uri: '' }))} />
          <SourceToggle label="Local File" active={values.kind === 'local_file'} onPress={() => setValues((current) => ({ ...current, kind: 'local_file', uri: '' }))} />
        </View>

        <Field label="Display Name" icon="pricetag" value={values.displayName} placeholder="My Playlist" error={errors.displayName} onChangeText={(value) => update('displayName', value)} />
        <Field label={values.kind === 'remote_url' ? 'M3U URL' : 'Local File URI'} icon={values.kind === 'remote_url' ? 'globe' : 'document'} value={values.uri} placeholder={values.kind === 'remote_url' ? 'https://example.com/playlist.m3u' : 'file:///storage/emulated/0/playlist.m3u'} error={errors.uri} onChangeText={(value) => update('uri', value)} />
        <Field label="EPG URL Optional" icon="calendar" value={values.epgUri ?? ''} placeholder="https://example.com/epg.xml" error={errors.epgUri} onChangeText={(value) => update('epgUri', value)} />

        {values.kind === 'local_file' ? (
          <View style={styles.noteBox}>
            <Ionicons name="construct" size={18} color={colors.warning} />
            <Text style={styles.noteText}>Local file picker UI can be connected later. This form already supports the local file source descriptor.</Text>
          </View>
        ) : null}

        {message ? (
          <View style={[styles.messageBox, status === 'success' ? styles.successBox : styles.errorBox]}>
            <Ionicons name={status === 'success' ? 'checkmark-circle' : 'alert-circle'} size={20} color={status === 'success' ? colors.success : colors.primary} />
            <Text style={styles.messageText}>{message}</Text>
          </View>
        ) : null}

        <AnimatedPressable style={[styles.primaryButton, status === 'loading' && styles.disabledButton]} disabled={status === 'loading'} onPress={submit}>
          <Ionicons name={status === 'loading' ? 'hourglass' : 'add-circle'} size={20} color={colors.text} />
          <Text style={styles.primaryText}>{status === 'loading' ? 'Registering...' : 'Register Source'}</Text>
        </AnimatedPressable>
        {onCancel ? <AnimatedPressable style={styles.secondaryButton} onPress={onCancel}><Text style={styles.secondaryText}>Cancel</Text></AnimatedPressable> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SourceToggle({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <AnimatedPressable style={[styles.toggle, active && styles.toggleActive]} onPress={onPress}><Text style={[styles.toggleText, active && styles.toggleTextActive]}>{label}</Text></AnimatedPressable>;
}

function Field({ label, icon, value, placeholder, error, onChangeText }: { label: string; icon: keyof typeof Ionicons.glyphMap; value: string; placeholder: string; error?: string; onChangeText: (value: string) => void }) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputShell, error && styles.inputError]}>
        <Ionicons name={icon} size={20} color={colors.textMuted} />
        <TextInput value={value} placeholder={placeholder} placeholderTextColor={colors.textSubtle} autoCapitalize="none" autoCorrect={false} keyboardType="url" onChangeText={onChangeText} style={styles.input} />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 54, paddingBottom: 34, gap: 16 },
  iconShell: { width: 74, height: 74, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, marginBottom: 4 },
  title: { color: colors.text, fontSize: 36, lineHeight: 40, fontWeight: '900', letterSpacing: -1 },
  subtitle: { color: colors.textMuted, fontSize: typography.body, lineHeight: 22, marginBottom: 10, maxWidth: 340 },
  toggleRow: { flexDirection: 'row', gap: 10, marginVertical: 6 },
  toggle: { flex: 1, height: 48, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  toggleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleText: { color: colors.textMuted, fontSize: typography.caption, fontWeight: '900' },
  toggleTextActive: { color: colors.text },
  fieldBlock: { gap: 8 },
  label: { color: colors.text, fontSize: typography.caption, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  inputShell: { minHeight: 58, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  inputError: { borderColor: 'rgba(229,9,20,0.8)', backgroundColor: 'rgba(229,9,20,0.08)' },
  input: { flex: 1, color: colors.text, fontSize: typography.body, fontWeight: '700' },
  errorText: { color: colors.primary, fontSize: typography.caption, fontWeight: '800' },
  noteBox: { flexDirection: 'row', gap: 10, backgroundColor: 'rgba(255,181,71,0.1)', borderWidth: 1, borderColor: 'rgba(255,181,71,0.25)', borderRadius: radius.lg, padding: 12 },
  noteText: { flex: 1, color: colors.textMuted, fontSize: typography.caption, lineHeight: 18, fontWeight: '700' },
  messageBox: { borderRadius: radius.lg, padding: 14, flexDirection: 'row', gap: 10, borderWidth: 1 },
  successBox: { backgroundColor: 'rgba(38,208,124,0.1)', borderColor: 'rgba(38,208,124,0.3)' },
  errorBox: { backgroundColor: 'rgba(229,9,20,0.1)', borderColor: 'rgba(229,9,20,0.3)' },
  messageText: { flex: 1, color: colors.text, fontSize: typography.caption, lineHeight: 18, fontWeight: '700' },
  primaryButton: { marginTop: 8, height: 58, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  disabledButton: { opacity: 0.65 },
  primaryText: { color: colors.text, fontSize: typography.body, fontWeight: '900' },
  secondaryButton: { height: 52, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  secondaryText: { color: colors.text, fontSize: typography.body, fontWeight: '900' },
});
