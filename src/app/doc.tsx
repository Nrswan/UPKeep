import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { ChoiceGrid, PlacePicker } from '../components/ChoiceGrid';
import { PhotoStrip } from '../components/PhotoStrip';
import { Button, confirmAction, DateStepper, Field, Screen, styles as ui } from '../components/ui';
import { todayStr } from '../lib/due';
import { docCategories, docCategory } from '../lib/insurance';
import { removePhotos } from '../lib/photos';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';

const EXAMPLES: Record<string, string> = {
  closing: 'Closing disclosure',
  deed: 'Warranty deed',
  mortgage: 'Mortgage note',
  insurance: 'Declarations page 2026',
  claim: 'Roof claim estimate',
  inspection: 'Home inspection report',
  permit: 'Water heater permit',
  survey: 'Lot survey',
  tax: 'Property tax bill 2026',
  hoa: 'HOA rules',
  lease: 'Lease for Unit B',
  title: 'Vehicle title',
  registration: 'Registration 2026',
  manual: 'Furnace manual',
  receipt: 'New roof invoice',
  other: 'Name it',
};

/** Adds an important document, or edits one when an id is passed. */
export default function DocForm() {
  const t = useTheme();
  const { assetId, id, category: startCategory } = useLocalSearchParams<{ assetId?: string; id?: string; category?: string }>();
  const existing = useStore((s) => s.docs.find((d) => d.id === id));
  const assets = useStore((s) => s.assets);
  const addDoc = useStore((s) => s.addDoc);
  const updateDoc = useStore((s) => s.updateDoc);
  const removeDoc = useStore((s) => s.removeDoc);

  const [place, setPlace] = useState<string | undefined>(existing ? existing.assetId : assetId);
  const [category, setCategory] = useState(existing?.category ?? startCategory ?? '');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [date, setDate] = useState(existing?.date ?? todayStr());
  const [note, setNote] = useState(existing?.note ?? '');
  const [photos, setPhotos] = useState<string[]>(existing?.photos ?? []);

  const kind = assets.find((a) => a.id === place)?.kind;
  const cats = docCategories(kind);

  const values = () => ({
    assetId: place,
    category: category || 'other',
    title: title.trim() || docCategory(category).label,
    date,
    note: note.trim() || undefined,
    photos,
  });

  const save = () => {
    if (existing) {
      removePhotos(existing.photos.filter((p) => !photos.includes(p)));
      updateDoc(existing.id, values());
    } else {
      addDoc(values());
    }
    router.back();
  };

  const cancel = () => {
    removePhotos(existing ? photos.filter((p) => !existing.photos.includes(p)) : photos);
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Edit document' : 'Add a document' }} />
      <PlacePicker assets={assets} value={place} onChange={setPlace} noneLabel="General" label="Which home or vehicle?" />
      <ChoiceGrid label="What kind of paper is it?" options={cats} value={category} onChange={setCategory} />
      {category ? (
        <>
          <Field label="Name" value={title} onChangeText={setTitle} placeholder={EXAMPLES[category] ?? 'Name it'} autoCapitalize="sentences" />
          <PhotoStrip files label="The paper itself" photos={photos} onChange={setPhotos} />
          <Text style={[ui.hint, { color: t.sub }]}>Take a photo of each page, or add the PDF from your email or Files.</Text>
          <DateStepper label="Date on the paper" value={date} onChange={setDate} />
          <Field label="Note (optional)" value={note} onChangeText={setNote} placeholder="Original is in the fire safe" />
          <Button label={existing ? 'Save' : 'Save document'} onPress={save} />
        </>
      ) : (
        <Text style={[ui.sub, { color: t.sub }]}>Pick one to get started.</Text>
      )}
      <Button kind="plain" label="Cancel" onPress={cancel} />
      {existing ? (
        <Button
          kind="danger"
          label="Delete"
          onPress={() =>
            confirmAction(`Delete ${existing.title}?`, 'Its photos and files are deleted from this phone too.', 'Delete', () => {
              removePhotos(existing.photos);
              removeDoc(existing.id);
              router.back();
            })
          }
        />
      ) : null}
    </Screen>
  );
}
