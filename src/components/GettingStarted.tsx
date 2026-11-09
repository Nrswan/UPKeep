import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import { Card, styles as ui } from './ui';

/**
 * A short checklist that walks a new user through the parts of the app that
 * pay off most. It hides itself once everything is done or the user closes it.
 */
export function GettingStarted() {
  const t = useTheme();
  const assets = useStore((s) => s.assets);
  const logs = useStore((s) => s.logs);
  const warranties = useStore((s) => s.warranties);
  const hidden = useStore((s) => s.settings.hideStart);
  const updateSettings = useStore((s) => s.updateSettings);

  const home = assets.find((a) => a.kind === 'home');
  const vehicle = assets.find((a) => a.kind === 'vehicle');
  const first = home ?? vehicle;

  const steps: { label: string; hint: string; done: boolean; go: () => void }[] = [
    {
      label: 'Add your home',
      hint: 'Pick your appliances and get the right upkeep list.',
      done: !!home,
      go: () => router.push('/asset/new'),
    },
    {
      label: 'Add a vehicle',
      hint: 'Track oil changes and more by date or mileage.',
      done: !!vehicle,
      go: () => router.push('/asset/new'),
    },
    {
      label: 'Log a job you already did',
      hint: 'Open any task and mark it done with the date you did it.',
      done: logs.length > 0,
      go: () => first && router.push({ pathname: '/asset/[id]', params: { id: first.id } }),
    },
    {
      label: 'Save where your shutoffs are',
      hint: 'Water, gas and breaker panel. Worth knowing before a leak.',
      done: !!home?.facts?.length,
      go: () => (home ? router.push({ pathname: '/asset/[id]', params: { id: home.id } }) : router.push('/asset/new')),
    },
    {
      label: 'Track a warranty',
      hint: 'Snap the receipt and get a heads-up before coverage ends.',
      done: warranties.length > 0,
      go: () => router.push('/warranty/new'),
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  if (hidden || doneCount === steps.length) return null;

  return (
    <Card style={local.card}>
      <View style={local.head}>
        <View style={local.headText}>
          <Text style={[ui.title, { color: t.text }]}>Getting started</Text>
          <Text style={[ui.sub, { color: t.sub }]}>
            {doneCount} of {steps.length} done
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hide getting started"
          hitSlop={10}
          onPress={() => updateSettings({ hideStart: true })}
        >
          <Ionicons name="close" size={22} color={t.sub} />
        </Pressable>
      </View>
      <View style={[local.track, { backgroundColor: t.muted }]}>
        <View style={[local.fill, { backgroundColor: t.primary, width: `${(doneCount / steps.length) * 100}%` }]} />
      </View>
      {steps.map((s) => (
        <Pressable
          key={s.label}
          accessibilityRole="button"
          accessibilityLabel={`${s.label}. ${s.done ? 'Done' : s.hint}`}
          disabled={s.done}
          onPress={s.go}
          style={local.step}
        >
          <Ionicons name={s.done ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={s.done ? t.primary : t.sub} />
          <View style={local.stepText}>
            <Text style={[local.stepLabel, { color: s.done ? t.sub : t.text }, s.done && local.struck]}>{s.label}</Text>
            {s.done ? null : <Text style={[local.stepHint, { color: t.sub }]}>{s.hint}</Text>}
          </View>
          {s.done ? null : <Ionicons name="chevron-forward" size={18} color={t.sub} />}
        </Pressable>
      ))}
    </Card>
  );
}

const local = StyleSheet.create({
  card: { gap: 10 },
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headText: { gap: 2 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  stepText: { flex: 1 },
  stepLabel: { fontSize: 16, fontWeight: '600' },
  stepHint: { fontSize: 13, marginTop: 1 },
  struck: { textDecorationLine: 'line-through', fontWeight: '400' },
});
