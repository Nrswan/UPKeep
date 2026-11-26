import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Pills } from '../components/ChoiceGrid';
import { Button, confirmAction, DateStepper, Field, Screen, styles as ui } from '../components/ui';
import { CHORE_IDEAS, REPEATS } from '../lib/chores';
import { addDays, todayStr } from '../lib/due';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';

/** Adds a chore, or edits one when an id is passed. Opened only after the owner gate. */
export default function ChoreForm() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useStore((s) => s.chores.find((c) => c.id === id));
  const members = useStore((s) => s.members);
  const allChores = useStore((s) => s.chores);
  const addChore = useStore((s) => s.addChore);
  const updateChore = useStore((s) => s.updateChore);
  const removeChore = useStore((s) => s.removeChore);

  const today = todayStr();
  const [title, setTitle] = useState(existing?.title ?? '');
  const [memberId, setMemberId] = useState<string | undefined>(existing?.memberId);
  const [everyDays, setEveryDays] = useState<number | undefined>(existing ? existing.everyDays : 7);
  const [startAt, setStartAt] = useState(existing?.startAt ?? today);
  const [note, setNote] = useState(existing?.note ?? '');

  const have = new Set(allChores.map((c) => c.title.toLowerCase()));
  const ideas = CHORE_IDEAS.filter((i) => !have.has(i.title.toLowerCase())).slice(0, 8);

  const save = () => {
    const values = { title: title.trim(), memberId, everyDays, startAt, note: note.trim() || undefined };
    if (existing) updateChore(existing.id, values);
    else addChore(values);
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Edit chore' : 'Add a chore' }} />
      <Field label="Chore" value={title} onChangeText={setTitle} placeholder="Take out the trash" autoCapitalize="sentences" />
      {!existing && !title && ideas.length ? (
        <View style={ui.field}>
          <Text style={[ui.label, { color: t.sub }]}>Or pick one</Text>
          <View style={ui.row}>
            {ideas.map((i) => (
              <Button
                key={i.title}
                small
                kind="plain"
                label={i.title}
                onPress={() => {
                  setTitle(i.title);
                  setEveryDays(i.everyDays);
                }}
              />
            ))}
          </View>
        </View>
      ) : null}

      <Pills
        label="Who does it?"
        value={memberId ?? ''}
        onChange={(v) => setMemberId(v || undefined)}
        options={[...members.map((m) => ({ value: m.id, label: m.name })), { value: '', label: 'Anyone' }]}
      />
      <Pills label="How often?" value={everyDays} onChange={setEveryDays} options={REPEATS.map((r) => ({ value: r.days, label: r.label }))} />
      <View style={ui.field}>
        <Text style={[ui.label, { color: t.sub }]}>{everyDays ? 'First due' : 'Due'}</Text>
        <View style={ui.row}>
          <Button small kind={startAt === today ? 'primary' : 'plain'} label="Today" onPress={() => setStartAt(today)} />
          <Button small kind={startAt === addDays(today, 1) ? 'primary' : 'plain'} label="Tomorrow" onPress={() => setStartAt(addDays(today, 1))} />
          <Button small kind={startAt === addDays(today, 7) ? 'primary' : 'plain'} label="In a week" onPress={() => setStartAt(addDays(today, 7))} />
        </View>
      </View>
      <DateStepper future label="Or pick a day" value={startAt} onChange={setStartAt} />
      <Field label="Note (optional)" value={note} onChangeText={setNote} placeholder="Bins go out Tuesday night" />
      <Button label={existing ? 'Save' : 'Add chore'} disabled={!title.trim()} onPress={save} />
      <Button kind="plain" label="Cancel" onPress={() => router.back()} />
      {existing ? (
        <Button
          kind="danger"
          label="Delete chore"
          onPress={() =>
            confirmAction(`Delete ${existing.title}?`, 'Its history goes with it.', 'Delete', () => {
              removeChore(existing.id);
              router.back();
            })
          }
        />
      ) : null}
      <Text style={[local.small, { color: t.sub }]}>Chores stay on this phone. Everyone checks off on the same phone for now.</Text>
    </Screen>
  );
}

const local = StyleSheet.create({
  small: { fontSize: 12, textAlign: 'center' },
});
