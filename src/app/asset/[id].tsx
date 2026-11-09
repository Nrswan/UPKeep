import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Banner, BannerStat } from '../../components/Banner';
import { TaskRow } from '../../components/TaskRow';
import { Button, Card, Empty, Field, IconBadge, Screen, SectionTitle, styles as ui, toNumber } from '../../components/ui';
import { applianceLook } from '../../lib/appliances';
import { todayStr } from '../../lib/due';
import { addPhoto, photoUri, removePhotos } from '../../lib/photos';
import { useStore } from '../../lib/store';
import { gradients, useTheme } from '../../lib/theme';
import { useDueItems } from '../../lib/useDue';
import { vehicleLabel } from '../../lib/vehicles';

export default function AssetDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const asset = useStore((s) => s.assets.find((a) => a.id === id));
  const logs = useStore((s) => s.logs);
  const allAppliances = useStore((s) => s.appliances);
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

  const appliances = allAppliances.filter((a) => a.assetId === asset.id);
  const general = items.filter((i) => !i.task.applianceId);
  const year = todayStr().slice(0, 4);
  const mine = logs.filter((l) => l.assetId === asset.id);
  const spent = mine.filter((l) => l.doneAt.startsWith(year)).reduce((sum, l) => sum + (l.cost ?? 0), 0);

  const newMiles = toNumber(mileage);
  const saveMileage = () => {
    if (newMiles == null) return;
    updateAsset(asset.id, { mileage: Math.round(newMiles) });
    setMileage('');
  };

  const changePhoto = async (source: 'camera' | 'library') => {
    const name = await addPhoto(source);
    if (!name) return;
    const old = asset.photo;
    updateAsset(asset.id, { photo: name });
    removePhotos([old]);
  };

  const confirmRemove = () =>
    Alert.alert(`Remove ${asset.name}?`, 'Its tasks and history are removed too.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          router.back();
          removePhotos([asset.photo, ...mine.flatMap((l) => l.photos ?? []), ...appliances.flatMap((a) => a.photos)]);
          removeAsset(asset.id);
        },
      },
    ]);

  const label = vehicleLabel(asset);

  return (
    <Screen>
      <Stack.Screen options={{ title: asset.name }} />

      <Banner
        colors={asset.kind === 'home' ? gradients.home : gradients.vehicle}
        icon={asset.kind === 'home' ? 'home-variant' : 'car-side'}
        photo={asset.photo}
        title={asset.name}
        subtitle={asset.kind === 'vehicle' && label && label !== asset.name ? label : undefined}
        height={200}
      >
        <View style={local.stats}>
          <BannerStat value={items.length} label={items.length === 1 ? 'Task' : 'Tasks'} />
          <BannerStat value={`$${spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} label={`Spent in ${year}`} />
          {asset.kind === 'vehicle' ? (
            <BannerStat value={asset.mileage != null ? asset.mileage.toLocaleString() : '?'} label="Miles" />
          ) : null}
        </View>
      </Banner>

      <View style={ui.row}>
        <Button small kind="plain" icon="camera-outline" label={asset.photo ? 'Retake photo' : 'Take photo'} onPress={() => changePhoto('camera')} />
        <Button small kind="plain" icon="images-outline" label="Choose photo" onPress={() => changePhoto('library')} />
      </View>

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

      {asset.kind === 'home' ? (
        <>
          <SectionTitle>Appliances ({appliances.length})</SectionTitle>
          {appliances.length === 0 ? (
            <Text style={[ui.sub, { color: t.sub }]}>
              Add what the home has, like a swamp cooler or a gas range, and the right upkeep is added for each one.
            </Text>
          ) : null}
          {appliances.map((a) => {
            const look = applianceLook(a.category);
            const theirs = items.filter((i) => i.task.applianceId === a.id);
            const overdue = theirs.filter((i) => i.due.status === 'overdue').length;
            const soon = theirs.filter((i) => i.due.status === 'soon').length;
            const summary =
              overdue > 0 ? `${overdue} overdue` : soon > 0 ? `${soon} due soon` : `${theirs.length} ${theirs.length === 1 ? 'task' : 'tasks'}`;
            return (
              <Pressable
                key={a.id}
                accessibilityRole="button"
                accessibilityLabel={`${a.name}. ${summary}`}
                onPress={() => router.push({ pathname: '/appliance/[id]', params: { id: a.id } })}
              >
                <Card style={local.appliance}>
                  {a.photos[0] ? (
                    <Image source={{ uri: photoUri(a.photos[0]) }} style={[local.thumb, { backgroundColor: t.muted }]} />
                  ) : (
                    <IconBadge name={look.icon} color={look.color} size={48} />
                  )}
                  <View style={local.applianceMain}>
                    <Text style={[ui.title, { color: t.text }]} numberOfLines={1}>
                      {a.name}
                    </Text>
                    <Text style={[ui.sub, { color: overdue > 0 ? t.danger : soon > 0 ? t.warn : t.sub }]}>
                      {[summary, [a.brand, a.model].filter(Boolean).join(' ')].filter(Boolean).join('  ·  ')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={t.sub} />
                </Card>
              </Pressable>
            );
          })}
          <Button
            kind="plain"
            icon="add"
            label="Add an appliance"
            onPress={() => router.push({ pathname: '/appliance/new', params: { assetId: asset.id } })}
          />
        </>
      ) : null}

      <SectionTitle>{asset.kind === 'home' ? `House tasks (${general.length})` : 'Tasks'}</SectionTitle>
      {general.length === 0 ? <Text style={[ui.sub, { color: t.sub }]}>No tasks yet.</Text> : null}
      {general.map((i) => (
        <TaskRow key={i.task.id} task={i.task} due={i.due} kind={asset.kind} />
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
  stats: { flexDirection: 'row', gap: 8, marginTop: 10 },
  gap: { gap: 10 },
  appliance: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  applianceMain: { flex: 1, gap: 2 },
  thumb: { width: 48, height: 48, borderRadius: 12 },
});
