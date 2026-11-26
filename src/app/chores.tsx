import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { lockHousehold, MemberChip, MemberDot, useOwnerGate } from '../components/HouseholdBits';
import { Mascot } from '../components/Mascot';
import { Button, Card, Screen, SectionTitle, styles as ui } from '../components/ui';
import { choreDue, repeatLabel, starsThisWeek } from '../lib/chores';
import { todayStr } from '../lib/due';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import type { Chore } from '../lib/types';

const GROUPS: { key: string; label: string }[] = [
  { key: 'overdue', label: 'Late' },
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Coming up' },
  { key: 'done', label: 'Done' },
];

export default function ChoresScreen() {
  const t = useTheme();
  const members = useStore((s) => s.members);
  const chores = useStore((s) => s.chores);
  const logs = useStore((s) => s.choreLogs);
  const toggle = useStore((s) => s.toggleChoreDone);
  const { gate, modal, locked, hasPin } = useOwnerGate();
  const [who, setWho] = useState<string | null>(null);
  const today = todayStr();

  const stars = starsThisWeek(logs, today);
  const me = members.find((m) => m.id === who);
  // A person sees their own chores and the ones anyone can do.
  const mine = chores.filter((c) => !me || !c.memberId || c.memberId === me.id);
  const rows = mine.map((c) => ({ c, due: choreDue(c, logs, today) })).sort((a, b) => a.due.rank - b.due.rank || a.c.title.localeCompare(b.c.title));
  const left = rows.filter((r) => r.due.status === 'overdue' || r.due.status === 'today').length;
  const leader = [...stars.entries()].sort((a, b) => b[1] - a[1])[0];
  const leaderName = leader ? members.find((m) => m.id === leader[0])?.name : undefined;

  if (members.length === 0) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Chores' }} />
        <View style={local.hero}>
          <Mascot size={130} mood="happy" />
          <Text style={[local.heroTitle, { color: t.text }]}>Get the whole house helping</Text>
          <Text style={[ui.sub, local.center, { color: t.sub }]}>
            Add the people in your home, hand out chores and let everyone check them off on this phone. Kids earn a star for every chore.
          </Text>
        </View>
        <Button icon="people-outline" label="Set up my household" onPress={() => router.push('/household')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Chores' }} />
      <Text style={[ui.label, { color: t.sub }]}>Who is checking off chores?</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={local.chips}>
        <MemberChip on={who == null} onPress={() => setWho(null)} />
        {members.map((m) => (
          <MemberChip key={m.id} member={m} stars={stars.get(m.id)} on={who === m.id} onPress={() => setWho(m.id)} />
        ))}
      </ScrollView>

      <Card style={{ ...local.banner, backgroundColor: left ? t.warnBg : t.okBg }}>
        <Text style={[local.bannerText, { color: t.text }]}>
          {left
            ? `${left} chore${left === 1 ? '' : 's'} to do${me ? ` for ${me.name}` : ''} today`
            : chores.length
              ? `All caught up${me ? `, ${me.name}` : ''}. Nice work!`
              : 'No chores yet. Add the first one.'}
        </Text>
        {leaderName && leader[1] > 0 ? (
          <Text style={[ui.sub, { color: t.sub }]}>{`⭐ ${leaderName} leads this week with ${leader[1]}`}</Text>
        ) : null}
      </Card>

      {GROUPS.map((g) => {
        const list = rows.filter((r) => r.due.status === g.key);
        if (!list.length) return null;
        return (
          <View key={g.key} style={local.group}>
            <SectionTitle>
              {g.label} ({list.length})
            </SectionTitle>
            <Card style={local.list}>
              {list.map(({ c, due }, i) => (
                <ChoreRow
                  key={c.id}
                  c={c}
                  label={due.label}
                  status={due.status}
                  first={i === 0}
                  doneToday={due.lastDone?.doneAt === today}
                  onToggle={() => toggle(c.id, who ?? undefined)}
                  onEdit={() => gate(() => router.push({ pathname: '/chore', params: { id: c.id } }))}
                />
              ))}
            </Card>
          </View>
        );
      })}

      <Button icon="add" label="Add a chore" onPress={() => gate(() => router.push('/chore'))} />
      <Button kind="plain" icon="people-outline" label="Household and PIN" onPress={() => gate(() => router.push('/household'))} />
      {hasPin && !locked ? <Button kind="plain" icon="lock-closed-outline" label="Lock owner changes" onPress={lockHousehold} /> : null}
      {modal}
    </Screen>
  );
}

function ChoreRow({
  c,
  label,
  status,
  first,
  doneToday,
  onToggle,
  onEdit,
}: {
  c: Chore;
  label: string;
  status: string;
  first: boolean;
  doneToday: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const t = useTheme();
  const member = useStore((s) => s.members.find((m) => m.id === c.memberId));
  const color = status === 'overdue' ? t.danger : status === 'today' ? t.warn : t.sub;
  return (
    <View style={[local.row, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line }]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: doneToday }}
        accessibilityLabel={`${c.title}. ${doneToday ? 'Done today. Tap to undo' : 'Tap when done'}`}
        hitSlop={8}
        onPress={onToggle}
      >
        <Ionicons name={doneToday ? 'checkmark-circle' : 'ellipse-outline'} size={34} color={doneToday ? t.primary : t.sub} />
      </Pressable>
      <Pressable style={local.main} accessibilityRole="button" accessibilityLabel={`Edit ${c.title}`} onPress={onEdit}>
        <Text style={[local.title, { color: t.text }, doneToday && local.struck]} numberOfLines={2}>
          {c.title}
        </Text>
        <Text style={[local.meta, { color }]}>
          {label}
          {c.everyDays ? `  ·  ${repeatLabel(c.everyDays)}` : ''}
        </Text>
      </Pressable>
      <MemberDot member={member} size={30} />
    </View>
  );
}

const local = StyleSheet.create({
  hero: { alignItems: 'center', gap: 10, paddingVertical: 16 },
  heroTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  center: { textAlign: 'center' },
  chips: { gap: 8, paddingRight: 8 },
  banner: { gap: 4, borderWidth: 0 },
  bannerText: { fontSize: 17, fontWeight: '700' },
  group: { gap: 8 },
  list: { paddingVertical: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  main: { flex: 1, gap: 2 },
  title: { fontSize: 16, fontWeight: '600' },
  struck: { textDecorationLine: 'line-through', opacity: 0.6 },
  meta: { fontSize: 12, fontWeight: '600' },
});
