import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Banner } from '../../components/Banner';
import { PhotoStrip } from '../../components/PhotoStrip';
import { TaskRow } from '../../components/TaskRow';
import { Button, Card, Empty, Field, Screen, SectionTitle, styles as ui } from '../../components/ui';
import { applianceLook } from '../../lib/appliances';
import { removePhotos } from '../../lib/photos';
import { useStore } from '../../lib/store';
import { useTheme } from '../../lib/theme';
import { useDueItems } from '../../lib/useDue';

export default function ApplianceDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useStore((s) => s.appliances.find((a) => a.id === id));
  const home = useStore((s) => s.assets.find((a) => a.id === item?.assetId));
  const logs = useStore((s) => s.logs);
  const updateAppliance = useStore((s) => s.updateAppliance);
  const removeAppliance = useStore((s) => s.removeAppliance);
  const items = useDueItems(item?.assetId, id);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serial, setSerial] = useState('');
  const [note, setNote] = useState('');

  if (!item || !home) {
    return (
      <Screen>
        <Empty icon="help-circle-outline" title="Not found" body="This appliance was removed." />
      </Screen>
    );
  }

  const look = applianceLook(item.category);

  const startEdit = () => {
    setName(item.name);
    setBrand(item.brand ?? '');
    setModel(item.model ?? '');
    setSerial(item.serial ?? '');
    setNote(item.note ?? '');
    setEditing(true);
  };

  const saveEdit = () => {
    updateAppliance(item.id, {
      name: name.trim() || item.name,
      brand: brand.trim() || undefined,
      model: model.trim() || undefined,
      serial: serial.trim() || undefined,
      note: note.trim() || undefined,
    });
    setEditing(false);
  };

  const setPhotos = (photos: string[]) => {
    removePhotos(item.photos.filter((p) => !photos.includes(p)));
    updateAppliance(item.id, { photos });
  };

  const confirmRemove = () =>
    Alert.alert(`Remove ${item.name}?`, 'Its tasks, history and photos are removed too.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          router.back();
          const taskIds = new Set(items.map((i) => i.task.id));
          removePhotos([...item.photos, ...logs.filter((l) => taskIds.has(l.taskId)).flatMap((l) => l.photos ?? [])]);
          removeAppliance(item.id);
        },
      },
    ]);

  const facts: [string, string][] = [];
  if (item.brand) facts.push(['Brand', item.brand]);
  if (item.model) facts.push(['Model', item.model]);
  if (item.serial) facts.push(['Serial number', item.serial]);

  return (
    <Screen>
      <Stack.Screen options={{ title: home.name }} />

      <Banner
        colors={[look.color, '#1F2937']}
        icon={look.icon}
        photo={item.photos[0]}
        title={item.name}
        subtitle={[item.brand, item.model].filter(Boolean).join(' ') || undefined}
        height={170}
      />

      {editing ? (
        <Card style={local.gap}>
          <Field label="Name" value={name} onChangeText={setName} autoCapitalize="words" />
          <Field label="Brand" value={brand} onChangeText={setBrand} placeholder="Whirlpool, MasterCool, Rheem" autoCapitalize="words" />
          <Field label="Model number" value={model} onChangeText={setModel} placeholder="From the rating plate" autoCapitalize="characters" autoCorrect={false} />
          <Field label="Serial number" value={serial} onChangeText={setSerial} autoCapitalize="characters" autoCorrect={false} />
          <Field label="Note" value={note} onChangeText={setNote} placeholder="Install date, who services it, where the shutoff is" />
          <Button label="Save" onPress={saveEdit} />
          <Button kind="plain" label="Cancel" onPress={() => setEditing(false)} />
        </Card>
      ) : (
        <Card style={local.gap}>
          {facts.length === 0 && !item.note ? (
            <Text style={[ui.sub, { color: t.sub }]}>Add the brand, model and serial number so they are handy when you need parts or service.</Text>
          ) : null}
          {facts.map(([k, v]) => (
            <View key={k} style={local.fact}>
              <Text style={[ui.sub, { color: t.sub }]}>{k}</Text>
              <Text style={[local.factValue, { color: t.text }]}>{v}</Text>
            </View>
          ))}
          {item.note ? <Text style={[ui.sub, { color: t.text }]}>{item.note}</Text> : null}
          <Button small kind="plain" icon="create-outline" label="Edit details" onPress={startEdit} />
        </Card>
      )}

      <SectionTitle>Photos ({item.photos.length})</SectionTitle>
      <PhotoStrip label="The unit, its rating plate, filters or anything worth remembering" photos={item.photos} onChange={setPhotos} size={96} />

      <SectionTitle>Upkeep ({items.length})</SectionTitle>
      {items.length === 0 ? <Text style={[ui.sub, { color: t.sub }]}>No tasks yet.</Text> : null}
      {items.map((i) => (
        <TaskRow key={i.task.id} task={i.task} due={i.due} kind="home" />
      ))}
      <Button
        kind="plain"
        icon="add"
        label="Add a task"
        onPress={() => router.push({ pathname: '/task/new', params: { assetId: home.id, applianceId: item.id } })}
      />
      <Button kind="danger" label={`Remove ${item.name}`} onPress={confirmRemove} />
    </Screen>
  );
}

const local = StyleSheet.create({
  gap: { gap: 10 },
  fact: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  factValue: { fontSize: 15, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
});
