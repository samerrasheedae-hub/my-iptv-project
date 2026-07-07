import { AnimatedPressable } from '@/components/AnimatedPressable';
import { colors, radius, typography } from '@/design/tokens';
import { Ionicons } from '@expo/vector-icons';
import { Modal, StyleSheet, Text, View } from 'react-native';

export interface SelectorOption<T extends string | number> {
  id: T;
  label: string;
  subtitle?: string;
}

interface Props<T extends string | number> {
  visible: boolean;
  title: string;
  options: SelectorOption<T>[];
  selectedId?: T;
  onClose: () => void;
  onSelect: (id: T) => void;
}

export function PlayerSelectorSheet<T extends string | number>({ visible, title, options, selectedId, onClose, onSelect }: Props<T>) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <AnimatedPressable style={StyleSheet.absoluteFillObject} onPress={onClose} haptics={false} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <AnimatedPressable style={styles.close} onPress={onClose}><Ionicons name="close" size={22} color={colors.text} /></AnimatedPressable>
          </View>
          {options.map((option) => {
            const selected = option.id === selectedId;
            return (
              <AnimatedPressable key={String(option.id)} style={styles.option} onPress={() => { onSelect(option.id); onClose(); }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  {option.subtitle ? <Text style={styles.optionSubtitle}>{option.subtitle}</Text> : null}
                </View>
                {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
              </AnimatedPressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.58)' },
  sheet: { backgroundColor: colors.backgroundElevated, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 18, paddingBottom: 34, borderWidth: 1, borderColor: colors.border },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { color: colors.text, fontSize: typography.h2, fontWeight: '900' },
  close: { width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
  optionLabel: { color: colors.text, fontSize: typography.body, fontWeight: '900' },
  optionSubtitle: { color: colors.textMuted, fontSize: typography.caption, marginTop: 3 },
});
