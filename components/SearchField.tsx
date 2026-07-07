import { colors, radius, typography } from '@/design/tokens';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, View } from 'react-native';

export function SearchField({ value, onChangeText }: { value: string; onChangeText: (text: string) => void }) {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={21} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search movies, live, series..."
        placeholderTextColor={colors.textSubtle}
        style={styles.input}
        autoCorrect={false}
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 54, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10, marginBottom: 18 },
  input: { flex: 1, color: colors.text, fontSize: typography.body, fontWeight: '700' },
});
