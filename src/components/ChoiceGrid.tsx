import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../lib/theme';
import type { Asset } from '../lib/types';
import { styles as ui } from './ui';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/** A grid of big tappable choices with icons, like the product kinds. */
export function ChoiceGrid({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: string; label: string; icon: string; color: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  const t = useTheme();
  return (
    <View style={ui.field}>
      <Text style={[ui.label, { color: t.sub }]}>{label}</Text>
      <View style={local.grid}>
        {options.map((c) => {
          const on = value === c.key;
          return (
            <Pressable
              key={c.key}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={c.label}
              onPress={() => onChange(c.key)}
              style={[local.chip, { backgroundColor: on ? t.okBg : t.card, borderColor: on ? t.primary : t.line }]}
            >
              <MaterialCommunityIcons name={c.icon as IconName} size={22} color={on ? t.primary : c.color} />
              <Text style={[local.chipText, { color: on ? t.primary : t.text }]} numberOfLines={2}>
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Small pills for picking one of a few text choices. */
export function Pills<T extends string | number | undefined>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; color?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const t = useTheme();
  return (
    <View style={ui.field}>
      <Text style={[ui.label, { color: t.sub }]}>{label}</Text>
      <View style={ui.row}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={o.label}
              onPress={() => onChange(o.value)}
              style={[local.pill, { backgroundColor: on ? (o.color ?? t.primary) : t.muted }]}
            >
              <Text style={[local.pillText, { color: on ? '#FFFFFF' : t.text }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Which home or vehicle something belongs to, with an optional "none" choice. */
export function PlacePicker({
  assets,
  value,
  onChange,
  noneLabel = 'Not tied to one',
  label = 'For',
}: {
  assets: Asset[];
  value?: string;
  onChange: (id?: string) => void;
  noneLabel?: string;
  label?: string;
}) {
  if (assets.length === 0) return null;
  const opts: { value: string; label: string }[] = [...assets.map((a) => ({ value: a.id, label: a.name })), { value: '', label: noneLabel }];
  return <Pills label={label} options={opts} value={value ?? ''} onChange={(v) => onChange(v || undefined)} />;
}

const local = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { width: '31%', flexGrow: 1, borderWidth: 1.5, borderRadius: 14, padding: 10, alignItems: 'center', gap: 4, minHeight: 74, justifyContent: 'center' },
  chipText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  pill: { borderRadius: 999, paddingHorizontal: 14, minHeight: 36, justifyContent: 'center' },
  pillText: { fontSize: 14, fontWeight: '600' },
});
