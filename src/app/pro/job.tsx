import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { PhotoStrip } from '../../components/PhotoStrip';
import { Button, confirmAction, DateStepper, Empty, Field, Screen, styles as ui, toNumber } from '../../components/ui';
import { todayStr } from '../../lib/due';
import { removePhotos } from '../../lib/photos';
import { useStore } from '../../lib/store';
import { useTheme } from '../../lib/theme';

/** Adds a job record for a pro, or edits one when an id is passed. */
export default function ProJobForm() {
  const t = useTheme();
  const { contactId, id } = useLocalSearchParams<{ contactId?: string; id?: string }>();
  const existing = useStore((s) => s.proJobs.find((j) => j.id === id));
  const contact = useStore((s) => s.contacts.find((c) => c.id === (existing?.contactId ?? contactId)));
  const assets = useStore((s) => s.assets);
  const addProJob = useStore((s) => s.addProJob);
  const updateProJob = useStore((s) => s.updateProJob);
  const removeProJob = useStore((s) => s.removeProJob);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [date, setDate] = useState(existing?.date ?? todayStr());
  const [assetId, setAssetId] = useState<string | undefined>(existing?.assetId ?? (assets.length === 1 ? assets[0].id : undefined));
  const [cost, setCost] = useState(existing?.cost != null ? String(existing.cost) : '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [photos, setPhotos] = useState<string[]>(existing?.photos ?? []);

  if (!contact) {
    return (
      <Screen>
        <Empty icon="help-circle-outline" title="Not found" body="This pro was removed." />
      </Screen>
    );
  }

  const save = () => {
    const values = { title: title.trim(), date, assetId, cost: toNumber(cost), note: note.trim() || undefined, photos };
    if (existing) {
      removePhotos(existing.photos.filter((p) => !photos.includes(p)));
      updateProJob(existing.id, values);
    } else {
      addProJob({ ...values, contactId: contact.id });
    }
    router.back();
  };

  const cancel = () => {
    // Photos taken for a job that was never saved are not needed.
    if (!existing) removePhotos(photos);
    else removePhotos(photos.filter((p) => !existing.photos.includes(p)));
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Edit job' : `Job by ${contact.name}` }} />
      <Field label="What did they do?" value={title} onChangeText={setTitle} placeholder="Replaced the water heater" autoCapitalize="sentences" />
      <DateStepper label="Date of the work" value={date} onChange={setDate} />
      {assets.length ? (
        <View style={ui.field}>
          <Text style={[ui.label, { color: t.sub }]}>Where</Text>
          <View style={ui.row}>
            {assets.map((a) => (
              <Button
                key={a.id}
                small
                kind={assetId === a.id ? 'primary' : 'plain'}
                icon={a.kind === 'home' ? 'home-outline' : 'car-outline'}
                label={a.name}
                onPress={() => setAssetId(assetId === a.id ? undefined : a.id)}
              />
            ))}
          </View>
        </View>
      ) : null}
      <Field label="Cost (optional)" value={cost} onChangeText={setCost} placeholder="0.00" keyboardType="decimal-pad" />
      <Field label="Note (optional)" value={note} onChangeText={setNote} placeholder="Warranty on labor, parts used, invoice number" />
      <PhotoStrip label="Receipts, invoices and photos of the work" photos={photos} onChange={setPhotos} />
      <Button label={existing ? 'Save' : 'Save job'} disabled={!title.trim()} onPress={save} />
      <Button kind="plain" label="Cancel" onPress={cancel} />
      {existing ? (
        <Button
          kind="danger"
          label="Delete job"
          onPress={() =>
            confirmAction('Delete this job?', 'Its receipts and photos are deleted too.', 'Delete', () => {
              removePhotos(existing.photos);
              removeProJob(existing.id);
              router.back();
            })
          }
        />
      ) : null}
    </Screen>
  );
}
