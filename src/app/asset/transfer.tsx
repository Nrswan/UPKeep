import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Banner } from '../../components/Banner';
import { Button, Card, confirmAction, Empty, Screen, SectionTitle, styles as ui } from '../../components/ui';
import { APP_NAME } from '../../lib/brand';
import { formatDate, todayStr } from '../../lib/due';
import { exportTransfer, shareReport } from '../../lib/io';
import { removePhotos } from '../../lib/photos';
import { buildReportHtml } from '../../lib/report';
import { useStore } from '../../lib/store';
import { gradients, useTheme } from '../../lib/theme';
import { describeTransfer, selectTransfer } from '../../lib/transfer';

/** Sends one home or vehicle's records to its next owner. */
export default function TransferScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useStore();
  const asset = state.assets.find((a) => a.id === id);
  const [includeCosts, setIncludeCosts] = useState(false);
  const [includePhotos, setIncludePhotos] = useState(true);
  const [warrantyIds, setWarrantyIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState('');

  const picked = useMemo(
    () => (asset ? selectTransfer(state, asset.id, { includeCosts, warrantyIds }) : null),
    [state, asset, includeCosts, warrantyIds]
  );

  if (!asset || !picked) {
    return (
      <Screen>
        <Empty icon="help-circle-outline" title="Not found" body="This home or vehicle was removed." />
      </Screen>
    );
  }

  const send = async () => {
    setBusy(true);
    setSent('');
    try {
      const res = await exportTransfer(picked, includePhotos);
      setSent(
        res.missing
          ? `Ready to send. ${res.missing} ${res.missing === 1 ? 'photo was' : 'photos were'} missing and left out.`
          : `Ready to send. The new owner opens ${APP_NAME}, goes to Settings and taps "Import from a previous owner".`
      );
    } catch {
      setSent('Could not make the file. Please try again.');
    }
    setBusy(false);
  };

  const pdf = async () => {
    const s = useStore.getState();
    const html = buildReportHtml({ ...s, ...picked, contacts: picked.contacts, asset: picked.assets[0], today: todayStr() });
    try {
      await shareReport(html, asset.name);
    } catch {
      setSent('Could not make the report. Please try again.');
    }
  };

  const removeMine = () =>
    confirmAction(
      `Remove ${asset.name} from your phone?`,
      'Only do this after the new owner has the file. Its tasks, history, products and photos are removed from your phone. Your pros stay in your Pros tab.',
      'Remove',
      () => {
        const s = useStore.getState();
        removePhotos([
          asset.photo,
          ...s.logs.filter((l) => l.assetId === asset.id).flatMap((l) => l.photos ?? []),
          ...s.appliances.filter((a) => a.assetId === asset.id).flatMap((a) => a.photos),
          ...s.purchases.filter((p) => p.assetId === asset.id).flatMap((p) => p.photos),
        ]);
        s.removeAsset(asset.id);
        router.replace('/assets');
      }
    );

  const counts = describeTransfer(picked);

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Hand off' }} />
      <Banner
        colors={asset.kind === 'home' ? gradients.home : gradients.vehicle}
        icon={asset.kind === 'home' ? 'key-chain' : 'car-key'}
        photo={asset.photo}
        title={`Hand off ${asset.name}`}
        subtitle="Selling or moving? Give the next owner the full history and the pros who know the place."
        height={170}
      />

      <Card style={local.gap}>
        <Text style={[ui.label, { color: t.sub }]}>WHAT THEY GET</Text>
        <Text style={[ui.title, { color: t.text }]}>{counts || 'The basics. You have not logged much yet.'}</Text>
        <Text style={[ui.sub, { color: t.sub }]}>
          Plus the details you saved, like shutoff locations, paint colors and appliance model numbers, with their photos if you include them.
        </Text>
      </Card>

      <Card style={local.gap}>
        <View style={local.between}>
          <View style={local.flex}>
            <Text style={[ui.title, { color: t.text }]}>Include prices and costs</Text>
            <Text style={[ui.sub, { color: t.sub }]}>Off keeps what you paid private. Project spending only goes along when this is on.</Text>
          </View>
          <Switch value={includeCosts} onValueChange={setIncludeCosts} accessibilityLabel="Include prices and costs" />
        </View>
        <View style={local.between}>
          <View style={local.flex}>
            <Text style={[ui.title, { color: t.text }]}>Include photos</Text>
            <Text style={[ui.sub, { color: t.sub }]}>Receipts, labels and pictures of the work. Makes the file bigger.</Text>
          </View>
          <Switch value={includePhotos} onValueChange={setIncludePhotos} accessibilityLabel="Include photos" />
        </View>
      </Card>

      {state.warranties.length ? (
        <>
          <SectionTitle>Warranties that stay with it</SectionTitle>
          <Text style={[ui.sub, { color: t.sub }]}>Pick any that cover things the new owner is keeping, like a water heater or a roof.</Text>
          <Card style={local.list}>
            {state.warranties.map((w, i) => {
              const on = warrantyIds.includes(w.id);
              return (
                <Pressable
                  key={w.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={w.name}
                  onPress={() => setWarrantyIds((ids) => (on ? ids.filter((x) => x !== w.id) : [...ids, w.id]))}
                  style={[local.item, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line }]}
                >
                  <Ionicons name={on ? 'checkbox' : 'square-outline'} size={24} color={on ? t.primary : t.sub} />
                  <View style={local.flex}>
                    <Text style={[local.itemTitle, { color: t.text }]}>{w.name}</Text>
                    <Text style={[ui.sub, { color: t.sub }]}>Bought {formatDate(w.purchasedAt)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </Card>
        </>
      ) : null}

      <View style={[local.never, { backgroundColor: t.blueBg }]}>
        <Ionicons name="lock-closed-outline" size={18} color={t.blue} />
        <Text style={[local.neverText, { color: t.text }]}>
          Never included: your other homes and vehicles, pros who did not work here and any tenant or lease details.
        </Text>
      </View>

      <Button icon="share-outline" label={busy ? 'Working' : 'Send to the new owner'} disabled={busy} onPress={send} />
      {sent ? <Text style={[ui.sub, { color: t.text }]}>{sent}</Text> : null}
      <Text style={[local.small, { color: t.sub }]}>
        You can AirDrop it, text it, email it or save it to Files. Check warranty terms, since some only cover the first owner.
      </Text>

      <SectionTitle>New owner does not use {APP_NAME}?</SectionTitle>
      <Button kind="plain" icon="document-text-outline" label="Send a PDF record instead" onPress={pdf} />

      <SectionTitle>All done?</SectionTitle>
      <Button kind="danger" label={`Remove ${asset.name} from my phone`} onPress={removeMine} />
    </Screen>
  );
}

const local = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: 12 },
  between: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  list: { paddingVertical: 2 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, minHeight: 48 },
  itemTitle: { fontSize: 16, fontWeight: '600' },
  never: { flexDirection: 'row', gap: 10, borderRadius: 12, padding: 12 },
  neverText: { flex: 1, fontSize: 14, lineHeight: 20 },
  small: { fontSize: 12, lineHeight: 17 },
});
