import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDate } from '../lib/due';
import { docCategory, isPdf } from '../lib/insurance';
import { photoUri } from '../lib/photos';
import { useTheme } from '../lib/theme';
import type { HomeDoc } from '../lib/types';
import { Card, IconBadge, styles as ui } from './ui';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/** One saved document, used in the documents list and on the home or vehicle page. */
export function DocCard({ d, place }: { d: HomeDoc; place?: string }) {
  const t = useTheme();
  const cat = docCategory(d.category);
  const pic = d.photos.find((p) => !isPdf(p));
  const pdfs = d.photos.filter(isPdf).length;
  const pics = d.photos.length - pdfs;
  const files = [pdfs ? `${pdfs} PDF${pdfs === 1 ? '' : 's'}` : '', pics ? `${pics} photo${pics === 1 ? '' : 's'}` : ''].filter(Boolean).join(', ');
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${d.title}. Open`} onPress={() => router.push({ pathname: '/doc', params: { id: d.id } })}>
      <Card style={local.card}>
        {pic ? (
          <Image source={{ uri: photoUri(pic) }} style={[local.thumb, { backgroundColor: t.muted }]} />
        ) : (
          <IconBadge name={cat.icon as IconName} color={cat.color} size={48} />
        )}
        <View style={local.main}>
          <Text style={[ui.title, { color: t.text }]} numberOfLines={1}>
            {d.title}
          </Text>
          <Text style={[ui.sub, { color: t.sub }]} numberOfLines={1}>
            {[cat.label, d.date ? formatDate(d.date) : '', place].filter(Boolean).join('  ·  ')}
          </Text>
          <Text style={[local.meta, { color: files ? t.sub : t.warn }]}>{files || 'No file attached yet'}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={t.sub} />
      </Card>
    </Pressable>
  );
}

const local = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 48, height: 48, borderRadius: 12 },
  main: { flex: 1, gap: 2 },
  meta: { fontSize: 12 },
});
