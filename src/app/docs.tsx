import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { DocCard } from '../components/DocCard';
import { Button, Empty, Screen, SectionTitle, styles as ui } from '../components/ui';
import { docCategory, matchesDoc } from '../lib/insurance';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';

/** Important papers. With an assetId it shows one home or vehicle. Otherwise all of them. */
export default function DocsScreen() {
  const t = useTheme();
  const { assetId } = useLocalSearchParams<{ assetId?: string }>();
  const all = useStore((s) => s.docs);
  const assets = useStore((s) => s.assets);
  const asset = assets.find((a) => a.id === assetId);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string | null>(null);

  const mine = useMemo(() => (assetId ? all.filter((d) => d.assetId === assetId) : all), [all, assetId]);
  const used = [...new Set(mine.map((d) => d.category))];
  const shown = [...mine]
    .reverse()
    .filter((d) => (!filter || d.category === filter) && matchesDoc(d, query))
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  // Without a filter, group by place so a landlord can tell the houses apart.
  const groups: { key: string; label: string; items: typeof shown }[] = [];
  if (!assetId) {
    for (const d of shown) {
      const key = d.assetId && assets.some((a) => a.id === d.assetId) ? d.assetId : 'general';
      let g = groups.find((x) => x.key === key);
      if (!g) groups.push((g = { key, label: assets.find((a) => a.id === key)?.name ?? 'General', items: [] }));
      g.items.push(d);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: asset ? `Documents  ·  ${asset.name}` : 'Documents' }} />
      <Text style={[ui.sub, { color: t.sub }]}>
        Closing papers, deeds, insurance, permits, inspections and manuals, saved as photos or PDFs so you can find them when it counts.
      </Text>

      {mine.length > 4 ? (
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search, like deed or roof"
          placeholderTextColor={t.sub}
          accessibilityLabel="Search documents"
          autoCorrect={false}
          style={[ui.input, { color: t.text, backgroundColor: t.card, borderColor: t.line }]}
        />
      ) : null}
      {used.length > 1 ? (
        <View style={ui.row}>
          <Button small kind={filter ? 'plain' : 'primary'} label="All" onPress={() => setFilter(null)} />
          {used.map((k) => (
            <Button key={k} small kind={filter === k ? 'primary' : 'plain'} label={docCategory(k).label} onPress={() => setFilter(filter === k ? null : k)} />
          ))}
        </View>
      ) : null}

      {mine.length === 0 ? (
        <Empty icon="folder-open-outline" title="No documents yet" body="Snap a photo of a paper or add a PDF from Files, iCloud Drive or Google Drive." />
      ) : shown.length === 0 ? (
        <Text style={[ui.sub, { color: t.sub }]}>Nothing matches that search.</Text>
      ) : null}

      {assetId
        ? shown.map((d) => <DocCard key={d.id} d={d} />)
        : groups.map((g) => (
            <View key={g.key} style={local.group}>
              {groups.length > 1 ? <SectionTitle>{g.label}</SectionTitle> : null}
              {g.items.map((d) => (
                <DocCard key={d.id} d={d} />
              ))}
            </View>
          ))}

      <Button label="Add a document" icon="add" onPress={() => router.push({ pathname: '/doc', params: assetId ? { assetId } : {} })} />
      <Text style={[local.small, { color: t.sub }]}>Documents stay on this phone. Make a backup in Settings so you do not lose them if the phone does.</Text>
    </Screen>
  );
}

const local = StyleSheet.create({
  group: { gap: 12 },
  small: { fontSize: 12, textAlign: 'center' },
});
