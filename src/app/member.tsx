import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MemberDot } from '../components/HouseholdBits';
import { Pills } from '../components/ChoiceGrid';
import { Button, confirmAction, Field, Screen, styles as ui } from '../components/ui';
import { MEMBER_COLORS, nextColor, ROLES } from '../lib/chores';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import type { Member } from '../lib/types';

/** Adds or edits one person in the household. Opened only after the owner gate. */
export default function MemberForm() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useStore((s) => s.members.find((m) => m.id === id));
  const members = useStore((s) => s.members);
  const addMember = useStore((s) => s.addMember);
  const updateMember = useStore((s) => s.updateMember);
  const removeMember = useStore((s) => s.removeMember);

  const [name, setName] = useState(existing?.name ?? '');
  const [role, setRole] = useState<Member['role']>(existing?.role ?? (members.length === 0 ? 'owner' : 'kid'));
  const [color, setColor] = useState(existing?.color ?? nextColor(members));

  const owners = members.filter((m) => m.role === 'owner' && m.id !== existing?.id).length;
  const lastOwner = existing?.role === 'owner' && owners === 0;

  const save = () => {
    const values = { name: name.trim(), role, color };
    if (existing) updateMember(existing.id, values);
    else addMember(values);
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? `Edit ${existing.name}` : 'Add a person' }} />
      <View style={local.preview}>
        <MemberDot member={{ id: 'x', name: name || '?', role, color }} size={72} />
      </View>
      <Field label="Name" value={name} onChangeText={setName} placeholder="First name or nickname" autoCapitalize="words" />
      <Pills
        label="Role"
        value={role}
        onChange={(v) => setRole(lastOwner ? 'owner' : v)}
        options={ROLES.map((r) => ({ value: r.key, label: r.label }))}
      />
      <Text style={[ui.hint, { color: t.sub }]}>
        {lastOwner ? 'Every household needs an owner, so this person stays the owner.' : ROLES.find((r) => r.key === role)?.about}
      </Text>
      <View style={ui.field}>
        <Text style={[ui.label, { color: t.sub }]}>Color</Text>
        <View style={ui.row}>
          {MEMBER_COLORS.map((c) => (
            <Pressable
              key={c.key}
              accessibilityRole="radio"
              accessibilityState={{ selected: color === c.key }}
              accessibilityLabel={c.key}
              onPress={() => setColor(c.key)}
              style={[local.swatch, { backgroundColor: c.hex }, color === c.key && { borderColor: t.text, borderWidth: 3 }]}
            />
          ))}
        </View>
      </View>
      <Text style={[ui.hint, { color: t.sub }]}>Use a first name or nickname. Nothing else about the person is saved.</Text>
      <Button label={existing ? 'Save' : 'Add'} disabled={!name.trim()} onPress={save} />
      <Button kind="plain" label="Cancel" onPress={() => router.back()} />
      {existing && !lastOwner ? (
        <Button
          kind="danger"
          label={`Remove ${existing.name}`}
          onPress={() =>
            confirmAction(`Remove ${existing.name}?`, 'Their chores stay on the list for anyone to do.', 'Remove', () => {
              removeMember(existing.id);
              router.back();
            })
          }
        />
      ) : null}
    </Screen>
  );
}

const local = StyleSheet.create({
  preview: { alignItems: 'center', paddingVertical: 8 },
  swatch: { width: 40, height: 40, borderRadius: 20 },
});
