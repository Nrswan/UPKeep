import { router } from 'expo-router';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import { TaskRow } from '../../components/TaskRow';
import { Button, Empty, Screen, SectionTitle, styles as ui } from '../../components/ui';
import { useStore } from '../../lib/store';
import { useTheme } from '../../lib/theme';
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

  if (!hasAssets) {
    return (
      <Screen>
        <Empty
          icon="construct-outline"
          title="Nothing to keep up with yet"
          body="Add your home or a vehicle and Upkeep builds a starter maintenance schedule you can adjust."
        />
        <Button label="Add a home or vehicle" icon="add" onPress={() => router.push('/asset/new')} />
      </Screen>
    );
  }

  const sections = GROUPS.map((g) => ({ title: g.title, key: g.key, data: items.filter((i) => i.due.status === g.key) })).filter(
    (s) => s.data.length > 0
  );
  const urgent = items.filter((i) => i.due.status === 'overdue' || i.due.status === 'soon').length;

  return (
    <Screen scroll={false}>
      <SectionList
        sections={sections}
        keyExtractor={(i) => i.task.id}
        contentContainerStyle={ui.pad}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <Text style={[local.summary, { color: t.sub }]}>
            {urgent === 0 ? 'You are caught up.' : urgent === 1 ? '1 task needs attention.' : `${urgent} tasks need attention.`}
          </Text>
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
        renderItem={({ item }) => <TaskRow task={item.task} due={item.due} assetName={item.asset.name} />}
        ListEmptyComponent={<Empty icon="list-outline" title="No tasks" body="Add tasks from the My stuff tab." />}
      />
    </Screen>
  );
}

const local = StyleSheet.create({
  summary: { fontSize: 15 },
  help: { fontSize: 13, marginTop: 4, lineHeight: 18 },
});
