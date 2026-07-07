import { AnimatedPressable } from '@/components/AnimatedPressable';
import { colors, radius, typography } from '@/design/tokens';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export interface XtreamLoginFormValues {
  serverUrl: string;
  username: string;
  password: string;
}

export interface XtreamLoginFormProps {
  onAuthenticate?: (values: XtreamLoginFormValues) => Promise<void>;
  onCancel?: () => void;
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

type FormErrors = Partial<Record<keyof XtreamLoginFormValues, string>>;

const normalizeServerUrl = (value: string) => value.trim().replace(/\/+$/, '');

const isValidServerUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export function XtreamLoginForm({ onAuthenticate, onCancel }: XtreamLoginFormProps) {
  const [values, setValues] = useState<XtreamLoginFormValues>({ serverUrl: '', username: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>('idle');
  const [message, setMessage] = useState<string | undefined>();
  const canSubmit = useMemo(() => status !== 'loading', [status]);

  const update = (key: keyof XtreamLoginFormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    if (status === 'error') {
      setStatus('idle');
      setMessage(undefined);
    }
  };

  const validate = () => {
    const next: FormErrors = {};
    const serverUrl = normalizeServerUrl(values.serverUrl);

    if (!serverUrl) next.serverUrl = 'Server URL is required.';
    else if (!isValidServerUrl(serverUrl)) next.serverUrl = 'Use a valid http:// or https:// URL.';

    if (!values.username.trim()) next.username = 'Username is required.';
    if (!values.password) next.password = 'Password is required.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!canSubmit || !validate()) return;

    setStatus('loading');
    setMessage(undefined);

    try {
      if (!onAuthenticate) {
        throw new Error('Xtream authentication is not connected yet. The form is ready for repository integration.');
      }

      await onAuthenticate({ ...values, serverUrl: normalizeServerUrl(values.serverUrl), username: values.username.trim() });
      setStatus('success');
      setMessage('Xtream account connected successfully.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unable to connect Xtream account.');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.iconShell}>
          <Ionicons name="tv" size={34} color={colors.text} />
        </View>

        <Text style={styles.title}>Connect Xtream</Text>
        <Text style={styles.subtitle}>Add your provider account to load categories and streams through the repository layer.</Text>

        <View style={styles.form}>
          <Field
            label="Server URL"
            icon="globe"
            value={values.serverUrl}
            placeholder="https://example.com:8080"
            error={errors.serverUrl}
            autoCapitalize="none"
            keyboardType="url"
            onChangeText={(value) => update('serverUrl', value)}
          />
          <Field
            label="Username"
            icon="person"
            value={values.username}
            placeholder="Your Xtream username"
            error={errors.username}
            autoCapitalize="none"
            onChangeText={(value) => update('username', value)}
          />
          <Field
            label="Password"
            icon="lock-closed"
            value={values.password}
            placeholder="Your Xtream password"
            error={errors.password}
            secureTextEntry
            onChangeText={(value) => update('password', value)}
          />
        </View>

        {message ? (
          <View style={[styles.messageBox, status === 'success' ? styles.successBox : styles.errorBox]}>
            <Ionicons name={status === 'success' ? 'checkmark-circle' : 'alert-circle'} size={20} color={status === 'success' ? colors.success : colors.primary} />
            <Text style={styles.messageText}>{message}</Text>
          </View>
        ) : null}

        <AnimatedPressable style={[styles.primaryButton, status === 'loading' && styles.disabledButton]} disabled={!canSubmit} onPress={submit}>
          <Ionicons name={status === 'loading' ? 'hourglass' : 'log-in'} size={20} color={colors.text} />
          <Text style={styles.primaryText}>{status === 'loading' ? 'Connecting...' : 'Connect Account'}</Text>
        </AnimatedPressable>

        {onCancel ? (
          <AnimatedPressable style={styles.secondaryButton} onPress={onCancel}>
            <Text style={styles.secondaryText}>Cancel</Text>
          </AnimatedPressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface FieldProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  placeholder: string;
  error?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'url';
  onChangeText: (value: string) => void;
}

function Field({ label, icon, value, placeholder, error, secureTextEntry, autoCapitalize, keyboardType, onChangeText }: FieldProps) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputShell, error && styles.inputError]}>
        <Ionicons name={icon} size={20} color={colors.textMuted} />
        <TextInput
          value={value}
          placeholder={placeholder}
          placeholderTextColor={colors.textSubtle}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          autoCorrect={false}
          onChangeText={onChangeText}
          style={styles.input}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 54, paddingBottom: 34 },
  iconShell: { width: 74, height: 74, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, marginBottom: 20 },
  title: { color: colors.text, fontSize: 36, lineHeight: 40, fontWeight: '900', letterSpacing: -1 },
  subtitle: { color: colors.textMuted, fontSize: typography.body, lineHeight: 22, marginTop: 10, maxWidth: 330 },
  form: { marginTop: 30, gap: 16 },
  fieldBlock: { gap: 8 },
  label: { color: colors.text, fontSize: typography.caption, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  inputShell: { minHeight: 58, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  inputError: { borderColor: 'rgba(229,9,20,0.8)', backgroundColor: 'rgba(229,9,20,0.08)' },
  input: { flex: 1, color: colors.text, fontSize: typography.body, fontWeight: '700' },
  errorText: { color: colors.primary, fontSize: typography.caption, fontWeight: '800' },
  messageBox: { marginTop: 22, borderRadius: radius.lg, padding: 14, flexDirection: 'row', gap: 10, borderWidth: 1 },
  successBox: { backgroundColor: 'rgba(38,208,124,0.1)', borderColor: 'rgba(38,208,124,0.3)' },
  errorBox: { backgroundColor: 'rgba(229,9,20,0.1)', borderColor: 'rgba(229,9,20,0.3)' },
  messageText: { flex: 1, color: colors.text, fontSize: typography.caption, lineHeight: 18, fontWeight: '700' },
  primaryButton: { marginTop: 24, height: 58, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  disabledButton: { opacity: 0.65 },
  primaryText: { color: colors.text, fontSize: typography.body, fontWeight: '900' },
  secondaryButton: { marginTop: 12, height: 52, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  secondaryText: { color: colors.text, fontSize: typography.body, fontWeight: '900' },
});
