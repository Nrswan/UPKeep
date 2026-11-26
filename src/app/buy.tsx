import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { PhotoStrip } from '../components/PhotoStrip';
import { SpecFields } from '../components/SpecFields';
import { Button, confirmAction, DateStepper, Empty, Field, Screen, styles as ui, toNumber } from '../components/ui';
import { googleUrl } from '../lib/contacts';
import { todayStr } from '../lib/due';
import { removePhotos } from '../lib/photos';
import { buyAgainQuery, OTHER_CATEGORY, PURCHASE_CATEGORIES, purchaseCategory } from '../lib/purchases';
import { cleanSpecs, rowsForLabels } from '../lib/specs';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import type { Spec } from '../lib/types';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/** Adds a product for a home or vehicle, or edits one when an id is passed. */
export default function BuyForm() {
  const t = useTheme();
  const { assetId, id } = useLocalSearchParams<{ assetId?: string; id?: string }>();
  const existing = useStore((s) => s.purchases.find((p) => p.id === id));
  const asset = useStore((s) => s.assets.find((a) => a.id === (existing?.assetId ?? assetId)));
  const addPurchase = useStore((s) => s.addPurchase);
  const updatePurchase = useStore((s) => s.updatePurchase);
  const removePurchase = useStore((s) => s.removePurchase);

  const [category, setCategory] = useState(existing?.category ?? '');
  const [name, setName] = useState(existing?.name ?? '');
  const [brand, setBrand] = useState(existing?.brand ?? '');
  const [specs, setSpecs] = useState<Spec[]>(existing ? rowsForLabels(purchaseCategory(existing.category).fields, existing.specs) : []);
  const [store, setStore] = useState(existing?.store ?? '');
  const [price, setPrice] = useState(existing?.price != null ? String(existing.price) : '');
  const [date, setDate] = useState(existing?.date ?? todayStr());
  const [note, setNote] = useState(existing?.note ?? '');
  const [photos, setPhotos] = useState<string[]>(existing?.photos ?? []);

  if (!asset) {
    return (
      <Screen>
        <Empty icon="help-circle-outline" title="Not found" body="This home or vehicle was removed." />
      </Screen>
    );
  }

  const cats = [...PURCHASE_CATEGORIES[asset.kind], OTHER_CATEGORY];
  const cat = category ? purchaseCategory(category) : undefined;

  const pickCategory = (key: string) => {
    setCategory(key);
    // Keep anything already typed that the new category also uses.
    setSpecs((rows) => rowsForLabels(purchaseCategory(key).fields, rows.filter((r) => r.value.trim())));
  };

  const values = () => ({
    category: category || 'other',
    name: name.trim(),
    brand: brand.trim() || undefined,
    specs: cleanSpecs(specs),
    store: store.trim() || undefined,
    price: toNumber(price),
    date,
    note: note.trim() || undefined,
    photos,
  });

  const save = () => {
    if (existing) {
      removePhotos(existing.photos.filter((p) => !photos.includes(p)));
      updatePurchase(existing.id, values());
    } else {
      addPurchase({ ...values(), assetId: asset.id });
    }
    router.back();
  };

  const cancel = () => {
    removePhotos(existing ? photos.filter((p) => !existing.photos.includes(p)) : photos);
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Edit' : `Add to ${asset.name}` }} />

      <View style={ui.field}>
        <Text style={[ui.label, { color: t.sub }]}>What kind of thing is it?</Text>
        <View style={local.grid}>
          {cats.map((c) => {
            const on = category === c.key;
            return (
              <Pressable
                key={c.key}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={c.label}
                onPress={() => pickCategory(c.key)}
                style={[local.chip, { backgroundColor: on ? t.okBg : t.card, borderColor: on ? t.primary : t.line }]}
              >
                <MaterialCommunityIcons name={c.icon as IconName} size={22} color={on ? t.primary : c.color} />
                <Text style={[local.chipText, { color: on ? t.primary : t.text }]} numberOfLines={2}>
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {cat ? (
        <>
          <Field label="What is it?" value={name} onChangeText={setName} placeholder={cat.example} autoCapitalize="sentences" />
          <Field label="Brand" value={brand} onChangeText={setBrand} placeholder="Brand or maker" autoCapitalize="words" />
          <SpecFields labels={cat.fields} rows={specs} onChange={setSpecs} />
          <Field label="Where you bought it" value={store} onChangeText={setStore} placeholder="Home Depot, Lowe's, AutoZone" autoCapitalize="words" />
          <Field label="Price (optional)" value={price} onChangeText={setPrice} placeholder="0.00" keyboardType="decimal-pad" />
          <DateStepper label="Date bought" value={date} onChange={setDate} />
          <Field label="Note (optional)" value={note} onChangeText={setNote} placeholder="Bought two extra gallons, in the garage" />
          <PhotoStrip label="Photo of the label, can lid or receipt" photos={photos} onChange={setPhotos} />
          <Button label={existing ? 'Save' : 'Save it'} disabled={!name.trim()} onPress={save} />
        </>
      ) : (
        <Text style={[ui.sub, { color: t.sub }]}>Pick one and we will ask for the details that matter for it, like the color code for paint.</Text>
      )}
      <Button kind="plain" label="Cancel" onPress={cancel} />
      {existing ? (
        <>
          <Button kind="plain" icon="cart-outline" label="Buy it again" onPress={() => Linking.openURL(googleUrl(buyAgainQuery(existing)))} />
          <Button
            kind="danger"
            label="Delete"
            onPress={() =>
              confirmAction(`Delete ${existing.name}?`, 'Its photos are deleted too.', 'Delete', () => {
                removePhotos(existing.photos);
                removePurchase(existing.id);
                router.back();
              })
            }
          />
        </>
      ) : null}
    </Screen>
  );
}

const local = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { width: '31%', flexGrow: 1, borderWidth: 1.5, borderRadius: 14, padding: 10, alignItems: 'center', gap: 4, minHeight: 74, justifyContent: 'center' },
  chipText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
