import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { lockHousehold, MemberDot, useOwnerGate } from '../components/HouseholdBits';
import { Button, Card, confirmAction, Screen, SectionTitle, styles as ui } from '../components/ui';
import { roleLabel, ROLES, validPin } from '../lib/chores';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';

/** People in the home and the owner PIN. */
export default function HouseholdScreen() {
  const t = useTheme();
  const members = useStore((s) => s.members);
  const chores = useStore((s) => s.chores);
  const pin = useStore((s) => s.settings.householdPin);
  const updateSettings = useStore((s) => s.updateSettings);
  const { gate, modal } = useOwnerGate();
  const [newPin, setNewPin] = useState('');
  const [again, setAgain] = useState('');

  const kids = members.some((m) => m.role === 'kid' || m.role === 'roommate');
  const pinReady = validPin(newPin) && newPin === again;

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Household' }} />
      <Text style={[ui.sub, { color: t.sub }]}>
        Add everyone who lives here. The owner hands out chores. Everyone else can check off their own on this phone.
      </Text>

      <SectionTitle>People ({members.length})</SectionTitle>
      {members.length ? (
        <Card style={local.list}>
          {members.map((m, i) => {
            const count = chores.filter((c) => c.memberId === m.id).length;
            return (
              <Pressable
                key={m.id}
                accessibilityRole="button"
                accessibilityLabel={`${m.name}, ${roleLabel(m.role)}. Edit`}
                onPress={() => gate(() => router.push({ pathname: '/member', params: { id: m.id } }))}
                style={[local.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line }]}
              >
                <MemberDot member={m} size={40} />
                <View style={local.main}>
                  <Text style={[ui.title, { color: t.text }]}>{m.name}</Text>
                  <Text style={[ui.sub, { color: t.sub }]}>
                    {roleLabel(m.role)}  ·  {count} chore{count === 1 ? '' : 's'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={t.sub} />
              </Pressable>
            );
          })}
        </Card>
      ) : (
        <Text style={[ui.sub, { color: t.text }]}>Start with yourself as the owner, then add the rest of the house.</Text>
      )}
      <Button icon="person-add-outline" label={members.length ? 'Add a person' : 'Add myself as owner'} onPress={() => gate(() => router.push('/member'))} />

      <SectionTitle>What each role can do</SectionTitle>
      <Card style={local.roles}>
        {ROLES.map((r) => (
          <Text key={r.key} style={[ui.sub, { color: t.text }]}>
            <Text style={local.bold}>{r.label}: </Text>
            {r.about}
          </Text>
        ))}
      </Card>

      <SectionTitle>Owner PIN</SectionTitle>
      {pin ? (
        <>
          <Text style={[ui.sub, { color: t.text }]}>A PIN is set. Changing chores or people asks for it.</Text>
          <View style={ui.row}>
            <Button small kind="plain" icon="lock-closed-outline" label="Lock now" onPress={lockHousehold} />
            <Button
              small
              kind="danger"
              label="Remove PIN"
              onPress={() =>
                gate(() => confirmAction('Remove the PIN?', 'Anyone with the phone will be able to change chores and people.', 'Remove', () => updateSettings({ householdPin: undefined })))
              }
            />
          </View>
        </>
      ) : (
        <>
          <Text style={[ui.sub, { color: kids ? t.warn : t.sub }]}>
            {kids ? 'Set a 4 digit PIN so kids and roommates can check off chores but not change them.' : 'Optional. Set a 4 digit PIN so only you can change chores and people.'}
          </Text>
          <TextInput
            value={newPin}
            onChangeText={(v) => setNewPin(v.replace(/\D/g, '').slice(0, 4))}
            placeholder="New PIN"
            placeholderTextColor={t.sub}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            accessibilityLabel="New PIN"
            style={[ui.input, { color: t.text, backgroundColor: t.card, borderColor: t.line }]}
          />
          <TextInput
            value={again}
            onChangeText={(v) => setAgain(v.replace(/\D/g, '').slice(0, 4))}
            placeholder="Type it again"
            placeholderTextColor={t.sub}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            accessibilityLabel="Type the PIN again"
            style={[ui.input, { color: t.text, backgroundColor: t.card, borderColor: t.line }]}
          />
          {again.length === 4 && newPin !== again ? <Text style={[ui.sub, { color: t.danger }]}>Those do not match.</Text> : null}
          <Button
            label="Set PIN"
            disabled={!pinReady}
            onPress={() => {
              updateSettings({ householdPin: newPin });
              setNewPin('');
              setAgain('');
            }}
          />
          <Text style={[local.small, { color: t.sub }]}>This is a light lock for family use. If you forget it, make a backup in Settings and restore it. That clears the PIN and keeps everything else.</Text>
        </>
      )}
      {modal}
    </Screen>
  );
}

const local = StyleSheet.create({
  list: { paddingVertical: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  main: { flex: 1, gap: 2 },
  roles: { gap: 6 },
  bold: { fontWeight: '700' },
  small: { fontSize: 12, textAlign: 'center' },
});
