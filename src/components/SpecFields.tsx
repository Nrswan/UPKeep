import { StyleSheet, Text, TextInput, View } from 'react-native';

import { suggestedSpecLabels } from '../lib/specs';
import { useTheme } from '../lib/theme';
import type { Spec } from '../lib/types';
import { Button, styles as ui } from './ui';

const HINTS: Record<string, string> = {
  'Oil weight': '5W-30',
  'Oil type': 'Full synthetic',
  'Oil capacity': '5 qt',
  'Oil filter': 'Brand and part number',
  'Filter size': '20x25x1',
  'Filter rating': 'MERV 8',
  'Tire size': '245/75R16',
  'Main water shutoff': 'Front yard by the hose bib',
  'Gas shutoff': 'At the meter on the east wall',
  'Breaker panel': 'Garage, left of the door',
  'Furnace filter size': '20x25x1',
  'Paint colors': 'Living room: brand, color name and sheen',
  'Tire pressure': '35 psi front and rear',
};

/**
 * Editable list of parts and specs. Suggested fields for the task keep a fixed
 * label. Fields the user adds get an editable label.
 */
export function SpecFields({
  title = '',
  labels,
  rows,
  onChange,
}: {
  /** Task title used to pick the suggested fields. */
  title?: string;
  /** Or an explicit list of suggested fields. */
  labels?: string[];
  rows: Spec[];
  onChange: (rows: Spec[]) => void;
}) {
  const t = useTheme();
  const fixed = new Set((labels ?? suggestedSpecLabels(title)).map((l) => l.toLowerCase()));
  const set = (i: number, patch: Partial<Spec>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const input = [ui.input, { color: t.text, backgroundColor: t.card, borderColor: t.line }];

  return (
    <View style={local.wrap}>
      {rows.map((r, i) => {
        const isFixed = fixed.has(r.label.toLowerCase()) && i < fixed.size;
        return (
          <View key={i} style={ui.field}>
            {isFixed ? (
              <Text style={[ui.label, { color: t.sub }]}>{r.label}</Text>
            ) : (
              <TextInput
                value={r.label}
                onChangeText={(v) => set(i, { label: v })}
                placeholder="Name this field"
                placeholderTextColor={t.sub}
                accessibilityLabel="Field name"
                style={[input, local.customLabel]}
              />
            )}
            <TextInput
              value={r.value}
              onChangeText={(v) => set(i, { value: v })}
              placeholder={isFixed ? (HINTS[r.label] ?? '') : 'Value'}
              placeholderTextColor={t.sub}
              accessibilityLabel={r.label || 'Value'}
              autoCorrect={false}
              style={input}
            />
          </View>
        );
      })}
      <Button small kind="plain" icon="add" label="Add your own field" onPress={() => onChange([...rows, { label: '', value: '' }])} />
    </View>
  );
}

/** Read-only list of saved parts and specs. */
export function SpecList({ specs }: { specs: Spec[] }) {
  const t = useTheme();
  return (
    <View style={local.list}>
      {specs.map((s) => (
        <View key={s.label} style={local.fact}>
          <Text style={[ui.sub, { color: t.sub }]}>{s.label}</Text>
          <Text style={[local.value, { color: t.text }]}>{s.value}</Text>
        </View>
      ))}
    </View>
  );
}

const local = StyleSheet.create({
  wrap: { gap: 10 },
  customLabel: { minHeight: 40, fontSize: 14 },
  list: { gap: 8 },
  fact: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  value: { fontSize: 15, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
});
