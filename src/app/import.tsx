import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Mascot } from '../components/Mascot';
import { Button, Card, Screen, styles as ui } from '../components/ui';
import { APP_NAME } from '../lib/brand';
import { pickTransfer, restorePhotos } from '../lib/io';
import { newId, useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import { describeTransfer, type ParsedTransfer, prepareImport } from '../lib/transfer';

/** Brings in a home or vehicle's records from its previous owner. */
export default function ImportScreen() {
  const t = useTheme();
  const importRecords = useStore((s) => s.importRecords);
  const [file, setFile] = useState<ParsedTransfer | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const choose = async () => {
    setError('');
    try {
      const picked = await pickTransfer();
      if (picked) setFile(picked);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that file.');
    }
  };

  const bring = async () => {
    if (!file) return;
    setBusy(true);
    const { data } = prepareImport(file.data, useStore.getState().contacts, newId);
    await restorePhotos(file.photos);
    importRecords(data);
    setBusy(false);
    router.replace({ pathname: '/asset/[id]', params: { id: data.assets[0].id } });
  };

  const asset = file?.data.assets[0];

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Import records' }} />
      <View style={local.head}>
        <Mascot mood="happy" size={110} />
        <Text style={[local.title, { color: t.text }]}>Moving in?</Text>
        <Text style={[local.body, { color: t.sub }]}>
          If the previous owner used {APP_NAME}, they can send you a file with the history, appliances, products and the pros who already
          know the place.
        </Text>
      </View>

      {file && asset ? (
        <Card style={local.gap}>
          <View style={local.row}>
            <Ionicons name={asset.kind === 'home' ? 'home' : 'car'} size={26} color={t.primary} />
            <Text style={[ui.title, local.flex, { color: t.text }]}>{asset.name}</Text>
          </View>
          <Text style={[ui.sub, { color: t.text }]}>{describeTransfer(file.data) || 'The basic details.'}</Text>
          {file.exportedAt ? (
            <Text style={[ui.sub, { color: t.sub }]}>Sent {new Date(file.exportedAt).toLocaleDateString()}</Text>
          ) : null}
          <Text style={[ui.sub, { color: t.sub }]}>
            It is added alongside anything you already have. Nothing of yours is changed. Pros you already saved are matched, not doubled.
          </Text>
          <Button icon="download-outline" label={busy ? 'Working' : `Add ${asset.kind === 'home' ? 'this home' : 'this vehicle'}`} disabled={busy} onPress={bring} />
          <Button kind="plain" label="Choose a different file" onPress={choose} />
        </Card>
      ) : (
        <Button icon="folder-open-outline" label="Choose the file" onPress={choose} />
      )}
      {error ? <Text style={[ui.sub, { color: t.danger }]}>{error}</Text> : null}

      {!file ? (
        <Text style={[local.small, { color: t.sub }]}>
          If they texted or emailed it, save the file to Files first. AirDropped files can be opened right from your Downloads.
        </Text>
      ) : null}
    </Screen>
  );
}

const local = StyleSheet.create({
  flex: { flex: 1 },
  head: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  title: { fontSize: 26, fontWeight: '800' },
  body: { fontSize: 16, lineHeight: 23, textAlign: 'center' },
  gap: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  small: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
});
