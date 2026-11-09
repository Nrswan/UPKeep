import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Banner } from '../../components/Banner';
import { PhotoStrip } from '../../components/PhotoStrip';
import { Button, Card, Empty, Screen, SectionTitle, StatusPill, styles as ui } from '../../components/ui';
import { WarrantyForm } from '../../components/WarrantyForm';
import { describeMonths, formatDate, todayStr, warrantyInfo } from '../../lib/due';
import { removePhotos } from '../../lib/photos';
import { useStore } from '../../lib/store';
import { gradients, useTheme } from '../../lib/theme';

const PILL = { expired: 'overdue', soon: 'soon', ok: 'ok' } as const;

export default function WarrantyDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useStore((s) => s.warranties.find((w) => w.id === id));
  const updateWarranty = useStore((s) => s.updateWarranty);
  const removeWarranty = useStore((s) => s.removeWarranty);
  const [editing, setEditing] = useState(false);

  if (!item) {
    return (
      <Screen>
        <Empty icon="help-circle-outline" title="Not found" body="This warranty was removed." />
      </Screen>
    );
  }

  const info = warrantyInfo(item, todayStr());

  const confirmRemove = () =>
    Alert.alert(`Delete ${item.name}?`, 'Its photos are deleted too.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          router.back();
          removePhotos(item.photos);
          removeWarranty(item.id);
        },
      },
    ]);

  const facts: [string, string][] = [
    ['Purchased', formatDate(item.purchasedAt)],
    ['Warranty length', describeMonths(item.months)],
    [info.status === 'expired' ? 'Ended' : 'Ends', formatDate(info.expiresAt)],
  ];
  if (item.price != null) facts.push(['Price', `$${item.price.toFixed(2)}`]);
  if (item.retailer) facts.push(['Bought from', item.retailer]);

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Warranty' }} />

      {editing ? (
        <Card style={local.gap}>
          <WarrantyForm
            initial={item}
            submitLabel="Save changes"
            onSubmit={(v) => {
              // Photos taken off the form are no longer needed on disk.
              removePhotos(item.photos.filter((p) => !v.photos.includes(p)));
              updateWarranty(item.id, v);
              setEditing(false);
            }}
          />
          <Button kind="plain" label="Cancel" onPress={() => setEditing(false)} />
          <Button kind="danger" label="Delete warranty" onPress={confirmRemove} />
        </Card>
      ) : (
        <>
          <Banner colors={gradients.warranty} icon="shield-check" photo={item.photos[0]} title={item.name} height={180}>
            <View style={local.pill}>
              <StatusPill status={PILL[info.status]} label={info.label} />
            </View>
          </Banner>

          <Card style={local.gap}>
            {facts.map(([k, v]) => (
              <View key={k} style={local.fact}>
                <Text style={[ui.sub, { color: t.sub }]}>{k}</Text>
                <Text style={[local.factValue, { color: t.text }]}>{v}</Text>
              </View>
            ))}
            {item.note ? <Text style={[ui.sub, { color: t.text }]}>{item.note}</Text> : null}
          </Card>

          {item.photos.length ? (
            <>
              <SectionTitle>Photos ({item.photos.length})</SectionTitle>
              <PhotoStrip photos={item.photos} size={110} />
            </>
          ) : null}

          <Button label="Edit" icon="create-outline" onPress={() => setEditing(true)} />
        </>
      )}
    </Screen>
  );
}

const local = StyleSheet.create({
  gap: { gap: 10 },
  pill: { marginTop: 6 },
  fact: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  factValue: { fontSize: 15, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
});
