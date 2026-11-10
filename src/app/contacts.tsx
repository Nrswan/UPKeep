import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Field, IconBadge, Screen, styles as ui } from '../components/ui';
import { dialable, TRADES } from '../lib/contacts';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';

const OTHER = '__other__';

export default function ContactsScreen() {
  const t = useTheme();
  // Arriving from a task passes the kind of pro that job calls for.
  const { trade: wanted } = useLocalSearchParams<{ trade?: string }>();
  const contacts = useStore((s) => s.contacts);
  const addContact = useStore((s) => s.addContact);
  const updateContact = useStore((s) => s.updateContact);
  const removeContact = useStore((s) => s.removeContact);

  const [editing, setEditing] = useState<string | 'new' | null>(wanted && !contacts.some((c) => c.trade === wanted) ? 'new' : null);
  const [name, setName] = useState('');
  const [trade, setTrade] = useState(wanted && TRADES.includes(wanted) ? wanted : TRADES[0]);
  const [customTrade, setCustomTrade] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

  const open = (id: string | 'new') => {
    const c = contacts.find((x) => x.id === id);
    setName(c?.name ?? '');
    const known = !c || TRADES.includes(c.trade);
    setTrade(c ? (known ? c.trade : OTHER) : wanted && TRADES.includes(wanted) ? wanted : TRADES[0]);
    setCustomTrade(c && !known ? c.trade : '');
    setPhone(c?.phone ?? '');
    setNote(c?.note ?? '');
    setEditing(id);
  };

  const finalTrade = trade === OTHER ? customTrade.trim() : trade;
  const valid = name.trim().length > 0 && finalTrade.length > 0;

  const save = () => {
    const values = { name: name.trim(), trade: finalTrade, phone: phone.trim() || undefined, note: note.trim() || undefined };
    if (editing === 'new') addContact(values);
    else if (editing) updateContact(editing, values);
    setEditing(null);
  };

  const confirmRemove = (id: string, who: string) =>
    Alert.alert(`Remove ${who}?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeContact(id);
          setEditing(null);
        },
      },
    ]);

  const sorted = [...contacts].sort((a, b) => a.trade.localeCompare(b.trade) || a.name.localeCompare(b.name));

  return (
    <Screen>
      {editing ? (
        <Card style={local.gap}>
          <Field label="Name or business" value={name} onChangeText={setName} placeholder="Desert Air Heating and Cooling" autoCapitalize="words" />
          <View style={ui.field}>
            <Text style={[ui.label, { color: t.sub }]}>What they do</Text>
            <View style={ui.row}>
              {TRADES.map((x) => (
                <Button key={x} small kind={trade === x ? 'primary' : 'plain'} label={x} onPress={() => setTrade(x)} />
              ))}
              <Button small kind={trade === OTHER ? 'primary' : 'plain'} label="Other" onPress={() => setTrade(OTHER)} />
            </View>
          </View>
          {trade === OTHER ? (
            <Field label="Kind of work" value={customTrade} onChangeText={setCustomTrade} placeholder="Pool service, locksmith" autoCapitalize="words" />
          ) : null}
          <Field label="Phone" value={phone} onChangeText={setPhone} placeholder="505 555 0100" keyboardType="phone-pad" />
          <Field label="Note (optional)" value={note} onChangeText={setNote} placeholder="Who to ask for, account number, hours" />
          <Button label="Save contact" disabled={!valid} onPress={save} />
          <Button kind="plain" label="Cancel" onPress={() => setEditing(null)} />
          {editing !== 'new' ? <Button kind="danger" label="Remove contact" onPress={() => confirmRemove(editing, name || 'this contact')} /> : null}
        </Card>
      ) : (
        <>
          {sorted.length === 0 ? (
            <Text style={[ui.sub, { color: t.sub }]}>
              Save the people you call when a job is more than you want to take on. Their number then shows up right on the tasks they can
              help with.
            </Text>
          ) : null}
          {sorted.map((c) => (
            <Card key={c.id} style={local.row}>
              <IconBadge name="account-wrench" color={t.blue} />
              <Pressable style={local.main} accessibilityRole="button" accessibilityLabel={`${c.name}, ${c.trade}. Tap to edit`} onPress={() => open(c.id)}>
                <Text style={[ui.title, { color: t.text }]} numberOfLines={1}>
                  {c.name}
                </Text>
                <Text style={[ui.sub, { color: t.sub }]}>{[c.trade, c.phone].filter(Boolean).join('  ·  ')}</Text>
                {c.note ? <Text style={[ui.sub, { color: t.sub }]}>{c.note}</Text> : null}
              </Pressable>
              {c.phone ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${c.name}`}
                  hitSlop={8}
                  onPress={() => Linking.openURL(`tel:${dialable(c.phone!)}`)}
                  style={[local.call, { backgroundColor: t.okBg }]}
                >
                  <Ionicons name="call" size={20} color={t.primary} />
                </Pressable>
              ) : null}
            </Card>
          ))}
          <Button label="Add a contact" icon="add" onPress={() => open('new')} />
        </>
      )}
    </Screen>
  );
}

const local = StyleSheet.create({
  gap: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  main: { flex: 1, gap: 2 },
  call: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
