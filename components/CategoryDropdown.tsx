import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { colors } from '@/design/tokens';
import { Ionicons } from '@expo/vector-icons';

export type Category = 'Movies' | 'TV Series' | 'Live TV';

interface CategoryDropdownProps {
  selected: Category;
  onSelect: (category: Category) => void;
}

const categories: Category[] = ['Movies', 'TV Series', 'Live TV'];

export default function CategoryDropdown({ selected, onSelect }: CategoryDropdownProps) {
  const [visible, setVisible] = React.useState(false);

  const handleSelect = (cat: Category) => {
    onSelect(cat);
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.dropdownButton} onPress={() => setVisible(true)}>
        <View style={styles.content}>
          <Ionicons name="play" size={14} color={colors.text} />
          <Text style={styles.text}>{selected}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setVisible(false)}>
          <View style={styles.dropdownMenu}>
            {categories.map((cat, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, selected === cat && styles.menuItemActive]}
                onPress={() => handleSelect(cat)}
              >
                <Text style={[styles.menuText, selected === cat && styles.menuTextActive]}>
                  {cat}
                </Text>
                {selected === cat && <Ionicons name="checkmark" size={18} color={colors.accent} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dropdownButton: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 120,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { color: colors.text, fontSize: 14, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 120,
    paddingRight: 20,
  },
  dropdownMenu: {
    backgroundColor: colors.dropdownBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.dropdownBorder,
    minWidth: 160,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemActive: { backgroundColor: 'rgba(255,77,0,0.1)' },
  menuText: { color: colors.text, fontSize: 15, fontWeight: '500' },
  menuTextActive: { color: colors.accent, fontWeight: '600' },
});
