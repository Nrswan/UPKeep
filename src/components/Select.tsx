import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../lib/theme';
import { styles as ui } from './ui';

/**
 * A dropdown that opens a searchable list. When allowCustom is on, whatever the
 * user typed can be used even if it is not in the list.
 */
export function Select({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
  disabled,
  loading,
  allowCustom,
  emptyText = 'No matches',
}: {
  label: string;
  value?: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  allowCustom?: boolean;
  emptyText?: string;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const typed = query.trim();
  const showCustom = allowCustom && typed.length > 0 && !options.some((o) => o.toLowerCase() === typed.toLowerCase());

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={ui.field}>
      <Text style={[ui.label, { color: t.sub }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${value || placeholder}`}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[ui.input, local.trigger, { backgroundColor: t.card, borderColor: t.line, opacity: disabled ? 0.45 : 1 }]}
      >
        <Text style={[local.value, { color: value ? t.text : t.sub }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={t.sub} />
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={[local.sheet, { backgroundColor: t.bg, paddingTop: insets.top + 8, paddingBottom: insets.bottom }]}>
          <View style={local.head}>
            <Text style={[local.title, { color: t.text }]}>{label}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} onPress={() => setOpen(false)}>
              <Ionicons name="close" size={26} color={t.text} />
            </Pressable>
          </View>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={allowCustom ? 'Search or type your own' : 'Search'}
            placeholderTextColor={t.sub}
            autoCorrect={false}
            style={[ui.input, local.search, { color: t.text, backgroundColor: t.card, borderColor: t.line }]}
          />
          {loading ? (
            <View style={local.center}>
              <ActivityIndicator color={t.primary} />
              <Text style={[ui.sub, { color: t.sub }]}>Loading</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(o) => o}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={20}
              ListHeaderComponent={
                showCustom ? (
                  <Pressable accessibilityRole="button" onPress={() => pick(typed)} style={[local.option, { borderBottomColor: t.line }]}>
                    <Text style={[local.optionText, { color: t.primary }]}>Use "{typed}"</Text>
                  </Pressable>
                ) : undefined
              }
              ListEmptyComponent={
                showCustom ? undefined : <Text style={[ui.sub, local.empty, { color: t.sub }]}>{emptyText}</Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: item === value }}
                  onPress={() => pick(item)}
                  style={[local.option, { borderBottomColor: t.line }]}
                >
                  <Text style={[local.optionText, { color: t.text }]}>{item}</Text>
                  {item === value ? <Ionicons name="checkmark" size={20} color={t.primary} /> : null}
                </Pressable>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const local = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  value: { fontSize: 16, flex: 1 },
  sheet: { flex: 1, paddingHorizontal: 16 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800' },
  search: { marginBottom: 8 },
  option: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 4,
  },
  optionText: { fontSize: 17 },
  center: { paddingTop: 40, alignItems: 'center', gap: 10 },
  empty: { paddingTop: 24, textAlign: 'center' },
});
