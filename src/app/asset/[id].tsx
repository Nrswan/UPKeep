import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { TaskRow } from '../../components/TaskRow';
import { Button, Card, Empty, Field, Screen, SectionTitle, styles as ui, toNumber } from '../../components/ui';
import { todayStr } from '../../lib/due';
import { useStore } from '../../lib/store';
import { useTheme } from '../../lib/theme';
import { useDueItems } from '../../lib/useDue';

export default function AssetDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const asset = useStore((s) => s.assets.find((a) => a.id === id));
  const logs = useStore((s) => s.logs);
  const updateAsset = useStore((s) => s.updateAsset);
  const removeAsset = useStore((s) => s.removeAsset);
  const items = useDueItems(id);
  const [mileage, setMileage] = useState('');

  if (!asset) {
    return (
      <Screen>
        <Empty icon="help-circle-outline" title="Not found" body="This item was removed." />
      </Screen>
    );
  }

  const year = todayStr().slice(0, 4);
  const spent = logs
    .filter((l) => l.assetId === asset.id && l.doneAt.startsWith(year))
    .reduce((sum, l) => sum + (l.cost ?? 0), 0);

  const newMiles = toNumber(mileage);
  const saveMileage = () => {
    if (newMiles == null) return;
    updateAsset(asset.id, { mileage: Math.round(newMiles) });
    setMileage('');
  };

  const confirmRemove = () =>
    Alert.alert(`Remove ${asset.name}?`, 'Its tasks and history are removed too.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          router.back();
          removeAsset(asset.id);
        },
      },
    ]);

  return (
    <Screen>
      <Stack.Screen options={{ title: asset.name }} />

      <Card style={local.stats}>
        <View style={local.stat}>
          <Text style={[local.statValue, { color: t.text }]}>{items.length}</Text>
          <Text style={[local.statLabel, { color: t.sub }]}>{items.length === 1 ? 'task' : 'tasks'}</Text>
        </View>
        <View style={local.stat}>
          <Text style={[local.statValue, { color: t.text }]}>${spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
          <Text style={[local.statLabel, { color: t.sub }]}>spent in {year}</Text>
        </View>
        {asset.kind === 'vehicle' ? (
          <View style={local.stat}>
            <Text style={[local.statValue, { color: t.text }]}>{asset.mileage != null ? asset.mileage.toLocaleString() : '?'}</Text>
            <Text style={[local.statLabel, { color: t.sub }]}>miles</Text>
          </View>
        ) : null}
      </Card>

      {asset.kind === 'vehicle' ? (
        <Card style={local.gap}>
          <Field
            label="Update mileage"
            value={mileage}
            onChangeText={setMileage}
            placeholder={asset.mileage != null ? String(asset.mileage) : 'Odometer reading'}
            keyboardType="number-pad"
          />
          <Button small label="Save mileage" disabled={newMiles == null} onPress={saveMileage} />
        </Card>
      ) : null}

      <SectionTitle>Tasks</SectionTitle>
      {items.length === 0 ? <Text style={[ui.sub, { color: t.sub }]}>No tasks yet.</Text> : null}
      {items.map((i) => (
        <TaskRow key={i.task.id} task={i.task} due={i.due} />
      ))}

      <Button
        kind="plain"
        icon="add"
        label="Add a task"
        onPress={() => router.push({ pathname: '/task/new', params: { assetId: asset.id } })}
      />
      <Button kind="danger" label={`Remove ${asset.name}`} onPress={confirmRemove} />
    </Screen>
  );
}

const local = StyleSheet.create({
  stats: { flexDirection: 'row' },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 12 },
  gap: { gap: 10 },
});
