import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Empty, Screen, styles as ui } from '../../components/ui';
import { useStore } from '../../lib/store';
import { useTheme } from '../../lib/theme';
import { useDueItems } from '../../lib/useDue';

export default function AssetsScreen() {
  const t = useTheme();
  const assets = useStore((s) => s.assets);
  const items = useDueItems();

  return (
    <Screen>
      {assets.length === 0 ? (
        <Empty icon="home-outline" title="No homes or vehicles yet" body="Add one to get a starter schedule." />
      ) : null}

      {assets.map((a) => {
        const mine = items.filter((i) => i.asset.id === a.id);
        const overdue = mine.filter((i) => i.due.status === 'overdue').length;
        const soon = mine.filter((i) => i.due.status === 'soon').length;
        const summary =
          overdue > 0 ? `${overdue} overdue` : soon > 0 ? `${soon} due soon` : `${mine.length} ${mine.length === 1 ? 'task' : 'tasks'}`;
        return (
          <Pressable
            key={a.id}
            accessibilityRole="button"
            accessibilityLabel={`${a.name}. ${summary}`}
            onPress={() => router.push({ pathname: '/asset/[id]', params: { id: a.id } })}
          >
            <Card style={local.row}>
              <View style={[local.icon, { backgroundColor: t.okBg }]}>
                <Ionicons name={a.kind === 'home' ? 'home' : 'car'} size={22} color={t.primary} />
              </View>
              <View style={local.main}>
                <Text style={[ui.title, { color: t.text }]}>{a.name}</Text>
                <Text style={[ui.sub, { color: overdue > 0 ? t.danger : soon > 0 ? t.warn : t.sub }]}>
                  {summary}
                  {a.mileage != null ? `  ·  ${a.mileage.toLocaleString()} mi` : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={t.sub} />
            </Card>
          </Pressable>
        );
      })}

      <Button label="Add a home or vehicle" icon="add" onPress={() => router.push('/asset/new')} />
    </Screen>
  );
}

const local = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  main: { flex: 1, gap: 2 },
});
