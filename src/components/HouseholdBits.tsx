import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { create } from 'zustand';

import { memberHex } from '../lib/chores';
import { initials } from '../lib/contacts';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import type { Member } from '../lib/types';
import { Button, styles as ui } from './ui';

/** Whether the owner PIN was entered since the app opened. Not saved. */
const useUnlock = create<{ unlocked: boolean; set: (v: boolean) => void }>((set) => ({ unlocked: false, set: (unlocked) => set({ unlocked }) }));

export function lockHousehold() {
  useUnlock.getState().set(false);
}

/**
 * Wraps owner-only actions. With no PIN set, actions just run. With a PIN,
 * the first owner action asks for it, then the phone stays unlocked until the
 * app closes or someone taps Lock.
 */
export function useOwnerGate() {
  const pin = useStore((s) => s.settings.householdPin);
  const unlocked = useUnlock((s) => s.unlocked);
  const setUnlocked = useUnlock((s) => s.set);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const [typed, setTyped] = useState('');
  const [wrong, setWrong] = useState(false);
  const t = useTheme();

  const open = !pin || unlocked;
  const gate = (fn: () => void) => {
    if (open) fn();
    else {
      setTyped('');
      setWrong(false);
      setPending(() => fn);
    }
  };

  const check = (v: string) => {
    setTyped(v);
    if (v.length < 4) return;
    if (v === pin) {
      setUnlocked(true);
      const fn = pending;
      setPending(null);
      fn?.();
    } else {
      setWrong(true);
      setTyped('');
    }
  };

  const modal = (
    <Modal visible={pending != null} transparent animationType="fade" onRequestClose={() => setPending(null)}>
      <View style={local.back}>
        <View style={[local.box, { backgroundColor: t.card }]}>
          <Text style={[local.title, { color: t.text }]}>Owner PIN</Text>
          <Text style={[ui.sub, { color: wrong ? t.danger : t.sub, textAlign: 'center' }]}>
            {wrong ? 'That is not it. Try again.' : 'Only the owner can change chores and people.'}
          </Text>
          <TextInput
            value={typed}
            onChangeText={(v) => check(v.replace(/\D/g, '').slice(0, 4))}
            keyboardType="number-pad"
            secureTextEntry
            autoFocus
            maxLength={4}
            accessibilityLabel="Owner PIN"
            style={[ui.input, local.pin, { color: t.text, borderColor: t.line, backgroundColor: t.bg }]}
          />
          <Button kind="plain" label="Cancel" onPress={() => setPending(null)} />
        </View>
      </View>
    </Modal>
  );

  return { gate, modal, locked: !open, hasPin: !!pin };
}

/** A round badge with the person's initials in their color. */
export function MemberDot({ member, size = 36, selected }: { member?: Member; size?: number; selected?: boolean }) {
  const t = useTheme();
  const bg = member ? memberHex(member.color) : t.muted;
  return (
    <View
      style={[
        local.dot,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
        selected && { borderWidth: 3, borderColor: t.text },
      ]}
    >
      <Text style={[local.initials, { fontSize: size * 0.38, color: member ? '#FFFFFF' : t.sub }]}>{member ? initials(member.name) : '?'}</Text>
    </View>
  );
}

/** Tap to pick who is using the phone right now. */
export function MemberChip({ member, stars, on, onPress }: { member?: Member; stars?: number; on: boolean; onPress: () => void }) {
  const t = useTheme();
  const name = member?.name ?? 'Everyone';
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      accessibilityLabel={`${name}${stars ? `, ${stars} stars this week` : ''}`}
      onPress={onPress}
      style={[local.chip, { backgroundColor: on ? t.okBg : t.card, borderColor: on ? t.primary : t.line }]}
    >
      {member ? <MemberDot member={member} size={40} /> : <View style={[local.dot, local.all, { backgroundColor: t.muted }]}><Text style={{ fontSize: 18 }}>🏠</Text></View>}
      <Text style={[local.chipName, { color: t.text }]} numberOfLines={1}>
        {name}
      </Text>
      {member ? <Text style={[local.stars, { color: t.sub }]}>{`⭐ ${stars ?? 0}`}</Text> : null}
    </Pressable>
  );
}

const local = StyleSheet.create({
  back: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  box: { width: '100%', maxWidth: 360, borderRadius: 18, padding: 20, gap: 12 },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  pin: { textAlign: 'center', fontSize: 28, letterSpacing: 12 },
  dot: { alignItems: 'center', justifyContent: 'center' },
  all: { width: 40, height: 40, borderRadius: 20 },
  initials: { fontWeight: '800' },
  chip: { width: 84, borderWidth: 1.5, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center', gap: 4 },
  chipName: { fontSize: 13, fontWeight: '600' },
  stars: { fontSize: 12 },
});
