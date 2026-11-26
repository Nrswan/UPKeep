import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { googleUrl } from '../lib/contacts';
import { money } from '../lib/diy';
import { photoUri } from '../lib/photos';
import { buyAgainQuery, purchaseCategory, purchaseSummary } from '../lib/purchases';
import { useTheme } from '../lib/theme';
import type { Purchase } from '../lib/types';
import { Card, IconBadge, styles as ui } from './ui';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/** One saved product, used here and on the home or vehicle page. */
export function PurchaseCard({ p }: { p: Purchase }) {
  const t = useTheme();
  const cat = purchaseCategory(p.category);
  const summary = purchaseSummary(p);
  const where = [p.store, p.price != null ? money(p.price) : ''].filter(Boolean).join('  ·  ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${p.name}${p.brand ? `, ${p.brand}` : ''}. Open`}
      onPress={() => router.push({ pathname: '/buy', params: { id: p.id } })}
    >
      <Card style={local.card}>
        {p.photos[0] ? (
          <Image source={{ uri: photoUri(p.photos[0]) }} style={[local.thumb, { backgroundColor: t.muted }]} />
        ) : (
          <IconBadge name={cat.icon as IconName} color={cat.color} size={48} />
        )}
        <View style={local.main}>
          <Text style={[ui.title, { color: t.text }]} numberOfLines={1}>
            {p.name}
          </Text>
          <Text style={[ui.sub, { color: t.text }]} numberOfLines={1}>
            {[p.brand, cat.label].filter(Boolean).join('  ·  ')}
          </Text>
          {summary ? (
            <Text style={[ui.sub, { color: t.sub }]} numberOfLines={2}>
              {summary}
            </Text>
          ) : null}
          {where ? <Text style={[local.meta, { color: t.sub }]}>{where}</Text> : null}
        </View>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Buy ${p.name} again`}
          hitSlop={8}
          onPress={() => Linking.openURL(googleUrl(buyAgainQuery(p)))}
          style={[local.again, { backgroundColor: t.okBg }]}
        >
          <MaterialCommunityIcons name="cart-outline" size={20} color={t.primary} />
        </Pressable>
      </Card>
    </Pressable>
  );
}

const local = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 48, height: 48, borderRadius: 12 },
  main: { flex: 1, gap: 2 },
  meta: { fontSize: 12 },
  again: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
