import { router } from 'expo-router';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { Banner, BannerStat } from '../../components/Banner';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { GettingStarted } from '../../components/GettingStarted';
import { TaskRow } from '../../components/TaskRow';
import { Button, Card, Empty, IconBadge, Screen, SectionTitle, styles as ui } from '../../components/ui';
import { todayStr, warrantyInfo } from '../../lib/due';
import { useStore } from '../../lib/store';
import { gradients, useTheme } from '../../lib/theme';
import { type DueItem, useDueItems } from '../../lib/useDue';
import { useCurrentSeason } from '../../lib/useSeason';

const GROUPS: { key: DueItem['due']['status']; title: string }[] = [
  { key: 'overdue', title: 'Overdue' },
  { key: 'soon', title: 'Due soon' },
  { key: 'unlogged', title: 'Not logged yet' },
  { key: 'ok', title: 'Later' },
];

const REASONS = [
  {
    icon: 'piggy-bank-outline',
    color: '#1F8A63',
    title: 'Small jobs prevent big bills',
    body: 'A filter, a flush or an oil change costs little. The repair you get from skipping it does not.',
  },
  {
    icon: 'shield-home-outline',
    color: '#B91C1C',
    title: 'It keeps people safe',
    body: 'Working alarms, clear dryer vents, good brakes and sound gas lines matter most on the day something goes wrong.',
  },
  {
    icon: 'clipboard-check-outline',
    color: '#1E6FB8',
    title: 'Records pay off later',
    body: 'A service history helps with warranty claims and shows a buyer the home or vehicle was cared for.',
  },
] as const;

export default function DueScreen() {
  const t = useTheme();
  const items = useDueItems();
  const hasAssets = useStore((s) => s.assets.length > 0);
  const warranties = useStore((s) => s.warranties);
  const season = useCurrentSeason();

  if (!hasAssets) {
    return (
      <Screen>
        <Banner
          colors={gradients.hero}
          icon="home-variant"
          height={190}
          title="Stay ahead of the upkeep"
          subtitle="Add your home or a vehicle and get a starter maintenance schedule you can adjust."
        />
        <GettingStarted />
        <Card style={local.reasons}>
          <Text style={[ui.title, { color: t.text }]}>Why upkeep is worth it</Text>
          {REASONS.map((r) => (
            <View key={r.title} style={local.reason}>
              <IconBadge name={r.icon} color={r.color} size={40} />
              <View style={local.reasonText}>
                <Text style={[local.reasonTitle, { color: t.text }]}>{r.title}</Text>
                <Text style={[ui.sub, { color: t.sub }]}>{r.body}</Text>
              </View>
            </View>
          ))}
        </Card>
        <Button label="Add a home or vehicle" icon="add" onPress={() => router.push('/asset/new')} />
        <Button kind="plain" label="Track a warranty" icon="shield-checkmark-outline" onPress={() => router.push('/warranty/new')} />
      </Screen>
    );
  }

  const sections = GROUPS.map((g) => ({ title: g.title, key: g.key, data: items.filter((i) => i.due.status === g.key) })).filter(
    (s) => s.data.length > 0
  );
  const count = (k: DueItem['due']['status']) => items.filter((i) => i.due.status === k).length;
  const overdue = count('overdue');
  const soon = count('soon');
  const today = todayStr();
  const endingSoon = warranties.filter((w) => warrantyInfo(w, today).status === 'soon').length;

  const headline =
    overdue > 0
      ? overdue === 1
        ? '1 task is overdue'
        : `${overdue} tasks are overdue`
      : soon > 0
        ? soon === 1
          ? '1 task is coming up'
          : `${soon} tasks are coming up`
        : 'You are caught up';

  return (
    <Screen scroll={false}>
      <SectionList
        sections={sections}
        keyExtractor={(i) => i.task.id}
        contentContainerStyle={ui.pad}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={local.header}>
            <Banner colors={gradients.hero} icon={overdue > 0 ? 'alert-circle-outline' : 'check-decagram'} title={headline} height={170}>
              <View style={local.stats}>
                <BannerStat value={overdue} label="Overdue" />
                <BannerStat value={soon} label="Due soon" />
                <BannerStat value={endingSoon} label={endingSoon === 1 ? 'Warranty ending' : 'Warranties ending'} />
              </View>
            </Banner>
            <GettingStarted />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${season.def.label} checklist. ${season.done} of ${season.total} done`}
              onPress={() => router.push('/seasonal')}
            >
              <Card style={local.season}>
                <View style={[local.seasonIcon, { backgroundColor: season.def.colors[0] }]}>
                  <MaterialCommunityIcons name={season.def.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={24} color="#FFFFFF" />
                </View>
                <View style={local.seasonText}>
                  <Text style={[ui.title, { color: t.text }]}>{season.def.label} checklist</Text>
                  <Text style={[ui.sub, { color: t.sub }]}>
                    {season.done === season.total ? 'All done for the season' : `${season.done} of ${season.total} done`}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color={t.sub} />
              </Card>
            </Pressable>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View>
            <SectionTitle>
              {section.title} ({section.data.length})
            </SectionTitle>
            {section.key === 'unlogged' ? (
              <Text style={[local.help, { color: t.sub }]}>
                Open a task to log the last time you did it. Until then it counts from the day you added it.
              </Text>
            ) : null}
          </View>
        )}
        renderItem={({ item }) => <TaskRow task={item.task} due={item.due} kind={item.asset.kind} assetName={item.appliance ? `${item.asset.name}  ·  ${item.appliance.name}` : item.asset.name} />}
        ListEmptyComponent={<Empty icon="list-outline" title="No tasks" body="Add tasks from the My stuff tab." />}
      />
    </Screen>
  );
}

const local = StyleSheet.create({
  header: { gap: 12 },
  season: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  seasonIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  seasonText: { flex: 1, gap: 2 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 10 },
  help: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  reasons: { gap: 14 },
  reason: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  reasonText: { flex: 1, gap: 2 },
  reasonTitle: { fontSize: 15, fontWeight: '700' },
});
