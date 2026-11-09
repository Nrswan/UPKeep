import { StyleSheet, Text, View } from 'react-native';

import { APPLIANCES } from '../lib/appliances';
import { useTheme } from '../lib/theme';
import { Button, Card, IconBadge, styles as ui } from './ui';

/** Category key to the chosen option key. A missing key means the home does not have one. */
export type ApplianceChoices = Record<string, string | undefined>;

export function countApplianceTasks(choices: ApplianceChoices): number {
  let n = 0;
  for (const c of APPLIANCES) {
    const o = c.options.find((x) => x.key === choices[c.key]);
    if (o) n += o.tasks.length;
  }
  return n;
}

export function chosenAppliances(choices: ApplianceChoices): { category: string; option: string }[] {
  return APPLIANCES.filter((c) => choices[c.key]).map((c) => ({ category: c.key, option: choices[c.key]! }));
}

/** One row per kind of appliance. Tap a type to pick it and tap it again to clear it. */
export function AppliancePicker({ value, onChange }: { value: ApplianceChoices; onChange: (v: ApplianceChoices) => void }) {
  const t = useTheme();
  return (
    <Card style={local.card}>
      {APPLIANCES.map((c, i) => (
        <View key={c.key} style={[local.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line }]}>
          <IconBadge name={c.icon} color={c.color} size={38} />
          <View style={local.main}>
            <Text style={[local.label, { color: t.text }]}>{c.label}</Text>
            <View style={ui.row}>
              {c.options.map((o) => {
                const on = value[c.key] === o.key;
                return (
                  <Button
                    key={o.key}
                    small
                    kind={on ? 'primary' : 'plain'}
                    icon={on ? 'checkmark' : undefined}
                    label={c.options.length === 1 ? (on ? 'Have one' : 'Add') : o.chip}
                    onPress={() => onChange({ ...value, [c.key]: on ? undefined : o.key })}
                  />
                );
              })}
            </View>
          </View>
        </View>
      ))}
    </Card>
  );
}

const local = StyleSheet.create({
  card: { paddingVertical: 4 },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 12, alignItems: 'flex-start' },
  main: { flex: 1, gap: 8 },
  label: { fontSize: 16, fontWeight: '600' },
});
