import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Stars, tradeLabel } from '../../components/ProBits';
import { Button, Field, Screen, styles as ui } from '../../components/ui';
import { TRADES } from '../../lib/contacts';
import { useStore } from '../../lib/store';
import { useTheme } from '../../lib/theme';

const OTHER = '__other__';

/** Adds a pro, or edits one when an id is passed. */
export default function ProForm() {
  const t = useTheme();
  const { id, trade: wanted } = useLocalSearchParams<{ id?: string; trade?: string }>();
  const existing = useStore((s) => s.contacts.find((c) => c.id === id));
  const addContact = useStore((s) => s.addContact);
  const updateContact = useStore((s) => s.updateContact);

  const startTrade = existing?.trade ?? wanted ?? TRADES[0];
  const known = TRADES.includes(startTrade);
  const [name, setName] = useState(existing?.name ?? '');
  const [trade, setTrade] = useState(known ? startTrade : OTHER);
  const [customTrade, setCustomTrade] = useState(known ? '' : startTrade);
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [website, setWebsite] = useState(existing?.website ?? '');
  const [rating, setRating] = useState<number | undefined>(existing?.rating);
  const [note, setNote] = useState(existing?.note ?? '');

  const finalTrade = trade === OTHER ? customTrade.trim() : trade;
  const valid = name.trim().length > 0 && finalTrade.length > 0;

  const save = () => {
    const values = {
      name: name.trim(),
      trade: finalTrade,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      website: website.trim() || undefined,
      rating,
      note: note.trim() || undefined,
    };
    if (existing) {
      updateContact(existing.id, values);
      router.back();
    } else {
      const newId = addContact(values);
      router.replace({ pathname: '/pro/[id]', params: { id: newId } });
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Edit pro' : 'Add a pro' }} />
      <Field label="Name or business" value={name} onChangeText={setName} placeholder="Desert Air Heating and Cooling" autoCapitalize="words" />
      <View style={ui.field}>
        <Text style={[ui.label, { color: t.sub }]}>What they do</Text>
        <View style={ui.row}>
          {TRADES.map((x) => (
            <Button key={x} small kind={trade === x ? 'primary' : 'plain'} label={tradeLabel(x)} onPress={() => setTrade(x)} />
          ))}
          <Button small kind={trade === OTHER ? 'primary' : 'plain'} label="Other" onPress={() => setTrade(OTHER)} />
        </View>
      </View>
      {trade === OTHER ? (
        <Field label="Kind of work" value={customTrade} onChangeText={setCustomTrade} placeholder="Pool service, locksmith" autoCapitalize="words" />
      ) : null}
      <Field label="Phone" value={phone} onChangeText={setPhone} placeholder="505 555 0100" keyboardType="phone-pad" />
      <Field label="Email (optional)" value={email} onChangeText={setEmail} placeholder="office@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
      <Field label="Website (optional)" value={website} onChangeText={setWebsite} placeholder="example.com" keyboardType="url" autoCapitalize="none" autoCorrect={false} />
      <View style={ui.field}>
        <Text style={[ui.label, { color: t.sub }]}>How were they?</Text>
        <Stars value={rating} onChange={setRating} size={30} />
      </View>
      <Field label="Note (optional)" value={note} onChangeText={setNote} placeholder="Ask for Mike. Fair prices, showed up on time." />
      <Button label={existing ? 'Save' : 'Save pro'} disabled={!valid} onPress={save} />
    </Screen>
  );
}
