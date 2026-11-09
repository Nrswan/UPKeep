import { router } from 'expo-router';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import { Banner, BannerStat } from '../../components/Banner';
import { TaskRow } from '../../components/TaskRow';
import { Button, Empty, Screen, SectionTitle, styles as ui } from '../../components/ui';
import { todayStr, warrantyInfo } from '../../lib/due';
import { useStore } from '../../lib/store';
import { gradients, useTheme } from '../../lib/theme';
import { type DueItem, useDueItems } from '../../lib/useDue';

const GROUPS: { key: DueItem['due']['status']; title: string }[] = [
  { key: 'overdue', title: 'Overdue' },
  { key: 'soon', title: 'Due soon' },
  { key: 'unlogged', title: 'Not logged yet' },
  { key: 'ok', title: 'Later' },
];

export default function DueScreen() {
  const t = useTheme();
  const items = useDueItems();
  const hasAssets = useStore((s) => s.assets.length > 0);
  const warranties = useStore((s) => s.warranties);

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
          <Banner colors={gradients.hero} icon={overdue > 0 ? 'alert-circle-outline' : 'check-decagram'} title={headline} height={170}>
            <View style={local.stats}>
              <BannerStat value={overdue} label="Overdue" />
              <BannerStat value={soon} label="Due soon" />
              <BannerStat value={endingSoon} label={endingSoon === 1 ? 'Warranty ending' : 'Warranties ending'} />
            </View>
          </Banner>
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
        renderItem={({ item }) => <TaskRow task={item.task} due={item.due} kind={item.asset.kind} assetName={item.asset.name} />}
        ListEmptyComponent={<Empty icon="list-outline" title="No tasks" body="Add tasks from the My stuff tab." />}
      />
    </Screen>
  );
}

const local = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 8, marginTop: 10 },
  help: { fontSize: 13, marginTop: 4, lineHeight: 18 },
});
