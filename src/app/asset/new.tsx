import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Field, Screen, SectionTitle, styles as ui, toNumber } from '../../components/ui';
import { describeInterval } from '../../lib/due';
import { PRESETS } from '../../lib/presets';
import { ensurePermission } from '../../lib/reminders';
import { useStore } from '../../lib/store';
import { useTheme } from '../../lib/theme';
import type { AssetKind } from '../../lib/types';

export default function NewAsset() {
  const t = useTheme();
  const addAsset = useStore((s) => s.addAsset);
  const remindersOn = useStore((s) => s.settings.remindersOn);
  const updateSettings = useStore((s) => s.updateSettings);

  const [kind, setKind] = useState<AssetKind>('home');
  const [name, setName] = useState('');
  const [mileage, setMileage] = useState('');
  const [off, setOff] = useState<Record<string, boolean>>({});

  const presets = PRESETS[kind];
  const key = (title: string) => `${kind}:${title}`;
  const picked = presets.filter((p) => !off[key(p.title)]);
  const miles = toNumber(mileage);
  const canSave = name.trim().length > 0 && (kind === 'home' || miles != null);

  const save = async () => {
    const id = addAsset({ kind, name, mileage: kind === 'vehicle' ? miles : undefined, presets: picked });
    // Ask for notification permission at the moment it makes sense to the user.
    if (remindersOn) {
      const ok = await ensurePermission();
      if (!ok) updateSettings({ remindersOn: false });
    }
    router.replace({ pathname: '/asset/[id]', params: { id } });
  };

  return (
    <Screen>
      <View style={local.kinds}>
        {(['home', 'vehicle'] as const).map((k) => {
          const active = kind === k;
          return (
            <Pressable
              key={k}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setKind(k)}
              style={[local.kind, { backgroundColor: active ? t.okBg : t.card, borderColor: active ? t.primary : t.line }]}
            >
              <Ionicons name={k === 'home' ? 'home' : 'car'} size={26} color={active ? t.primary : t.sub} />
              <Text style={[ui.title, { color: active ? t.primary : t.text }]}>{k === 'home' ? 'Home' : 'Vehicle'}</Text>
            </Pressable>
          );
        })}
      </View>

      <Field
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder={kind === 'home' ? 'Our house' : '2019 Tacoma'}
        autoCapitalize="words"
        returnKeyType="done"
      />
      {kind === 'vehicle' ? (
        <Field
          label="Current mileage"
          value={mileage}
          onChangeText={setMileage}
          placeholder="84500"
          keyboardType="number-pad"
          hint="Used to track tasks that depend on miles driven."
        />
      ) : null}

      <SectionTitle>Starter schedule ({picked.length})</SectionTitle>
      <Text style={[ui.sub, { color: t.sub }]}>Turn off anything that does not apply. You can change intervals later.</Text>
      <Card style={local.list}>
        {presets.map((p, i) => {
          const on = !off[key(p.title)];
          return (
            <Pressable
              key={p.title}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              onPress={() => setOff((o) => ({ ...o, [key(p.title)]: on }))}
              style={[local.item, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line }]}
            >
              <Ionicons name={on ? 'checkbox' : 'square-outline'} size={24} color={on ? t.primary : t.sub} />
              <View style={local.itemText}>
                <Text style={[local.itemTitle, { color: on ? t.text : t.sub }]}>{p.title}</Text>
                <Text style={[local.itemSub, { color: t.sub }]}>{describeInterval(p)}</Text>
              </View>
            </Pressable>
          );
        })}
      </Card>

      <Button label={kind === 'home' ? 'Add home' : 'Add vehicle'} disabled={!canSave} onPress={save} />
    </Screen>
  );
}

const local = StyleSheet.create({
  kinds: { flexDirection: 'row', gap: 12 },
  kind: { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 18, alignItems: 'center', gap: 6 },
  list: { paddingVertical: 2 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, minHeight: 48 },
  itemText: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: '500' },
  itemSub: { fontSize: 13, marginTop: 1 },
});
