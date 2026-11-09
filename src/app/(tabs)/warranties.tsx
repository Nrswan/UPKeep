import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Banner, BannerStat } from '../../components/Banner';
import { Button, Card, IconBadge, Screen, StatusPill, styles as ui } from '../../components/ui';
import { formatDate, todayStr, warrantyInfo } from '../../lib/due';
import { photoUri } from '../../lib/photos';
import { useStore } from '../../lib/store';
import { gradients, useTheme } from '../../lib/theme';

const PILL = { expired: 'overdue', soon: 'soon', ok: 'ok' } as const;

export default function WarrantiesScreen() {
  const t = useTheme();
  const warranties = useStore((s) => s.warranties);
  const today = todayStr();

  const rows = warranties
    .map((w) => ({ w, info: warrantyInfo(w, today) }))
    // Ending soonest first, with expired ones at the bottom.
    .sort((a, b) => (a.info.daysLeft < 0 ? 1e6 - a.info.daysLeft : a.info.daysLeft) - (b.info.daysLeft < 0 ? 1e6 - b.info.daysLeft : b.info.daysLeft));

  const active = rows.filter((r) => r.info.status !== 'expired').length;
  const soon = rows.filter((r) => r.info.status === 'soon').length;
  const covered = rows.filter((r) => r.info.status !== 'expired').reduce((sum, r) => sum + (r.w.price ?? 0), 0);

  return (
    <Screen>
      <Banner
        colors={gradients.warranty}
        icon="shield-check"
        height={warranties.length ? 150 : 180}
        title={warranties.length ? 'Your warranties' : 'Never lose a warranty again'}
        subtitle={
          warranties.length
            ? undefined
            : 'Save what you bought, snap the receipt and get a heads-up a month before coverage ends.'
        }
      >
        {warranties.length ? (
          <View style={local.stats}>
            <BannerStat value={active} label="Active" />
            <BannerStat value={soon} label="Ending soon" />
            <BannerStat value={`$${covered.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} label="Covered" />
          </View>
        ) : null}
      </Banner>

      {rows.map(({ w, info }) => (
        <Pressable
          key={w.id}
          accessibilityRole="button"
          accessibilityLabel={`${w.name}. ${info.label}`}
          onPress={() => router.push({ pathname: '/warranty/[id]', params: { id: w.id } })}
        >
          <Card style={local.row}>
            {w.photos[0] ? (
              <Image source={{ uri: photoUri(w.photos[0]) }} style={[local.thumb, { backgroundColor: t.muted }]} />
            ) : (
              <IconBadge name="shield-check" color={t.purple} size={56} />
            )}
            <View style={local.main}>
              <Text style={[ui.title, { color: t.text }]} numberOfLines={1}>
                {w.name}
              </Text>
              <Text style={[ui.sub, { color: t.sub }]}>
                {info.status === 'expired' ? 'Ended' : 'Ends'} {formatDate(info.expiresAt)}
              </Text>
              <StatusPill status={PILL[info.status]} label={info.label} />
            </View>
            <Ionicons name="chevron-forward" size={20} color={t.sub} />
          </Card>
        </Pressable>
      ))}

      <Button label="Add a warranty" icon="add" onPress={() => router.push('/warranty/new')} />
    </Screen>
  );
}

const local = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 8, marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 56, height: 56, borderRadius: 12 },
  main: { flex: 1, gap: 4 },
});
