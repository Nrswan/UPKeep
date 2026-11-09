import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Banner } from '../../components/Banner';
import { Button, Empty, Screen } from '../../components/ui';
import { useStore } from '../../lib/store';
import { gradients } from '../../lib/theme';
import { useDueItems } from '../../lib/useDue';
import { vehicleLabel } from '../../lib/vehicles';

export default function AssetsScreen() {
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
        const detail = [
          a.kind === 'vehicle' && vehicleLabel(a) !== a.name ? vehicleLabel(a) : null,
          a.mileage != null ? `${a.mileage.toLocaleString()} mi` : null,
        ]
          .filter(Boolean)
          .join('  ·  ');
        return (
          <Pressable
            key={a.id}
            accessibilityRole="button"
            accessibilityLabel={`${a.name}. ${summary}`}
            onPress={() => router.push({ pathname: '/asset/[id]', params: { id: a.id } })}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <Banner
              colors={a.kind === 'home' ? gradients.home : gradients.vehicle}
              icon={a.kind === 'home' ? 'home-variant' : 'car-side'}
              photo={a.photo}
              title={a.name}
              subtitle={detail || undefined}
              height={140}
            >
              <View style={[local.chip, overdue > 0 && local.chipAlert, overdue === 0 && soon > 0 && local.chipWarn]}>
                <Text style={[local.chipText, (overdue > 0 || soon > 0) && local.chipTextDark]}>{summary}</Text>
              </View>
            </Banner>
          </Pressable>
        );
      })}

      <Button label="Add a home or vehicle" icon="add" onPress={() => router.push('/asset/new')} />
    </Screen>
  );
}

const local = StyleSheet.create({
  chip: { alignSelf: 'flex-start', marginTop: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.22)' },
  chipAlert: { backgroundColor: '#FFD9D4' },
  chipWarn: { backgroundColor: '#FFE7B3' },
  chipText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  chipTextDark: { color: '#3A1A17' },
});
