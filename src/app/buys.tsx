import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PurchaseCard } from '../components/PurchaseCard';
import { Button, Empty, Screen, styles as ui } from '../components/ui';
import { matchesPurchase, purchaseCategory } from '../lib/purchases';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';

export default function BuysScreen() {
  const t = useTheme();
  const { assetId } = useLocalSearchParams<{ assetId: string }>();
  const asset = useStore((s) => s.assets.find((a) => a.id === assetId));
  const all = useStore((s) => s.purchases);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string | null>(null);

  const mine = useMemo(() => all.filter((p) => p.assetId === assetId), [all, assetId]);
  const used = [...new Set(mine.map((p) => p.category))];
  const shown = mine
    .filter((p) => (!filter || p.category === filter) && matchesPurchase(p, query))
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

  if (!asset) {
    return (
      <Screen>
        <Empty icon="help-circle-outline" title="Not found" body="This home or vehicle was removed." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: `Things I buy  ·  ${asset.name}` }} />
      <Text style={[ui.sub, { color: t.sub }]}>
        {asset.kind === 'home'
          ? 'The bulbs, paint colors, flooring and filters this home uses, so you can grab the right one next time.'
          : 'The tires, oil, wipers and parts this vehicle takes, so you can grab the right one next time.'}
      </Text>

      {mine.length > 3 ? (
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search, like gray or E26"
          placeholderTextColor={t.sub}
          accessibilityLabel="Search things I buy"
          autoCorrect={false}
          style={[ui.input, { color: t.text, backgroundColor: t.card, borderColor: t.line }]}
        />
      ) : null}
      {used.length > 1 ? (
        <View style={ui.row}>
          <Button small kind={filter ? 'plain' : 'primary'} label="All" onPress={() => setFilter(null)} />
          {used.map((k) => (
            <Button key={k} small kind={filter === k ? 'primary' : 'plain'} label={purchaseCategory(k).label} onPress={() => setFilter(filter === k ? null : k)} />
          ))}
        </View>
      ) : null}

      {mine.length === 0 ? (
        <Empty icon="pricetags-outline" title="Nothing saved yet" body="Add the products you buy for this place and they will be here when you need them again." />
      ) : shown.length === 0 ? (
        <Text style={[ui.sub, { color: t.sub }]}>Nothing matches that search.</Text>
      ) : null}

      {shown.map((p) => (
        <PurchaseCard key={p.id} p={p} />
      ))}

      <Button label="Add something" icon="add" onPress={() => router.push({ pathname: '/buy', params: { assetId: asset.id } })} />
      {mine.length ? (
        <Text style={[local.meta, local.center, { color: t.sub }]}>Tap the cart to search for the same product again.</Text>
      ) : null}
    </Screen>
  );
}

const local = StyleSheet.create({
  meta: { fontSize: 12 },
  center: { textAlign: 'center' },
});
