import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Banner, BannerStat } from '../../components/Banner';
import { Avatar, Stars, tradeLabel } from '../../components/ProBits';
import { Button, Card, Screen, SectionTitle, styles as ui } from '../../components/ui';
import { dialable, googleUrl, TRADE_INFO } from '../../lib/contacts';
import { money } from '../../lib/diy';
import { formatDate } from '../../lib/due';
import { useStore } from '../../lib/store';
import { gradients, useTheme } from '../../lib/theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export default function ProsScreen() {
  const t = useTheme();
  const contacts = useStore((s) => s.contacts);
  const proJobs = useStore((s) => s.proJobs);
  const logs = useStore((s) => s.logs);

  const jobsFor = (id: string) => [
    ...proJobs.filter((j) => j.contactId === id).map((j) => ({ date: j.date, cost: j.cost ?? 0 })),
    ...logs.filter((l) => l.contactId === id).map((l) => ({ date: l.doneAt, cost: l.cost ?? 0 })),
  ];
  const allJobs = contacts.flatMap((c) => jobsFor(c.id));
  const spent = allJobs.reduce((n, j) => n + Math.round(j.cost * 100), 0) / 100;

  const sorted = [...contacts].sort((a, b) => a.trade.localeCompare(b.trade) || (b.rating ?? 0) - (a.rating ?? 0) || a.name.localeCompare(b.name));
  const trades = [...new Set(sorted.map((c) => c.trade))];

  return (
    <Screen>
      <Banner
        colors={gradients.pros}
        icon="account-hard-hat"
        height={contacts.length ? 150 : 180}
        title={contacts.length ? 'Your pros' : 'Keep the good ones'}
        subtitle={
          contacts.length ? undefined : 'Save the plumbers, techs and mechanics you trust, with every job and receipt in one place.'
        }
      >
        {contacts.length ? (
          <View style={local.stats}>
            <BannerStat value={contacts.length} label={contacts.length === 1 ? 'Pro' : 'Pros'} />
            <BannerStat value={allJobs.length} label={allJobs.length === 1 ? 'Job' : 'Jobs'} />
            <BannerStat value={money(spent, false)} label="Spent" />
          </View>
        ) : null}
      </Banner>

      {trades.map((trade) => (
        <View key={trade} style={local.group}>
          <SectionTitle>{tradeLabel(trade)}</SectionTitle>
          {sorted
            .filter((c) => c.trade === trade)
            .map((c) => {
              const jobs = jobsFor(c.id).sort((a, b) => (a.date < b.date ? 1 : -1));
              return (
                <Card key={c.id} style={local.row}>
                  <Pressable
                    style={local.main}
                    accessibilityRole="button"
                    accessibilityLabel={`${c.name}. Open`}
                    onPress={() => router.push({ pathname: '/pro/[id]', params: { id: c.id } })}
                  >
                    <Avatar name={c.name} trade={c.trade} />
                    <View style={local.text}>
                      <Text style={[ui.title, { color: t.text }]} numberOfLines={1}>
                        {c.name}
                      </Text>
                      {c.rating ? <Stars value={c.rating} size={14} /> : null}
                      <Text style={[ui.sub, { color: t.sub }]}>
                        {jobs.length
                          ? `${jobs.length} ${jobs.length === 1 ? 'job' : 'jobs'}  ·  last ${formatDate(jobs[0].date)}`
                          : 'No jobs saved yet'}
                      </Text>
                    </View>
                  </Pressable>
                  {c.phone ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Call ${c.name}`}
                      hitSlop={8}
                      onPress={() => Linking.openURL(`tel:${dialable(c.phone!)}`)}
                      style={[local.call, { backgroundColor: t.okBg }]}
                    >
                      <Ionicons name="call" size={20} color={t.primary} />
                    </Pressable>
                  ) : null}
                </Card>
              );
            })}
        </View>
      ))}

      <Button label="Add a pro" icon="person-add-outline" onPress={() => router.push('/pro/new')} />

      <SectionTitle>Need someone new?</SectionTitle>
      <Text style={[ui.sub, { color: t.sub }]}>Tap a trade to search Google for one near you.</Text>
      <View style={local.grid}>
        {TRADE_INFO.map((info) => (
          <Pressable
            key={info.key}
            accessibilityRole="link"
            accessibilityLabel={`Search Google for ${info.search}`}
            onPress={() => Linking.openURL(googleUrl(info.search))}
            style={({ pressed }) => [local.tile, { backgroundColor: t.card, borderColor: t.line, opacity: pressed ? 0.7 : 1 }]}
          >
            <MaterialCommunityIcons name={info.icon as IconName} size={26} color={info.color} />
            <Text style={[local.tileText, { color: t.text }]} numberOfLines={2}>
              {tradeLabel(info.key)}
            </Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const local = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 8, marginTop: 10 },
  group: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  text: { flex: 1, gap: 3 },
  call: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '31%', flexGrow: 1, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 12, gap: 6, alignItems: 'center', minHeight: 86, justifyContent: 'center' },
  tileText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
