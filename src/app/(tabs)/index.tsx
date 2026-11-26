import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GettingStarted } from '../../components/GettingStarted';
import { Mascot, type Mood } from '../../components/Mascot';
import { TaskRow } from '../../components/TaskRow';
import { Button, Card, Empty, IconBadge, SectionTitle, styles as ui } from '../../components/ui';
import { MASCOT_NAME } from '../../lib/brand';
import { todayStr, warrantyInfo } from '../../lib/due';
import { choreDue } from '../../lib/chores';
import { renewalInfo } from '../../lib/insurance';
import { greeting, healthLabel, healthScore, level, tipOfDay } from '../../lib/fun';
import { useStore } from '../../lib/store';
import { gradients, useTheme } from '../../lib/theme';
import { type DueItem, useDueItems } from '../../lib/useDue';
import { useCurrentSeason } from '../../lib/useSeason';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

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

/** Home-E's hello at the top, with a speech bubble that fits how things are going. */
function Hero({ mood, line, title }: { mood: Mood; line: string; title: string }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[local.hero, { paddingTop: insets.top + 14 }]}>
      <View style={local.heroText}>
        <Text style={local.hello}>{greeting(new Date().getHours())}</Text>
        <Text style={local.heroTitle}>{title}</Text>
        <View style={local.bubble}>
          <Text style={local.bubbleText}>{line}</Text>
          <View style={local.bubbleTail} />
        </View>
      </View>
      <View style={local.dog}>
        <Mascot mood={mood} size={128} />
      </View>
    </LinearGradient>
  );
}

function Tile({ icon, color, title, sub, onPress }: { icon: IconName; color: string; title: string; sub: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${sub}`}
      onPress={onPress}
      style={({ pressed }) => [local.tile, { backgroundColor: t.card, borderColor: t.line, opacity: pressed ? 0.75 : 1 }]}
    >
      <View style={[local.tileIcon, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon} size={22} color="#FFFFFF" />
      </View>
      <Text style={[local.tileTitle, { color: t.text }]} numberOfLines={1}>
        {title}
      </Text>
      <Text style={[local.tileSub, { color: t.sub }]} numberOfLines={1}>
        {sub}
      </Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const t = useTheme();
  const items = useDueItems();
  const hasAssets = useStore((s) => s.assets.length > 0);
  const warranties = useStore((s) => s.warranties);
  const logs = useStore((s) => s.logs);
  const proJobs = useStore((s) => s.proJobs);
  const contacts = useStore((s) => s.contacts);
  const policies = useStore((s) => s.policies);
  const docs = useStore((s) => s.docs);
  const members = useStore((s) => s.members);
  const chores = useStore((s) => s.chores);
  const choreLogs = useStore((s) => s.choreLogs);
  const season = useCurrentSeason();
  const today = todayStr();

  if (!hasAssets) {
    return (
      <View style={[local.flex, { backgroundColor: t.bg }]}>
        <SectionList
          sections={[]}
          renderItem={() => null}
          contentContainerStyle={local.listPad}
          ListHeaderComponent={
            <View style={local.header}>
              <Hero mood="happy" title={`Hey, I'm ${MASCOT_NAME}`} line="Your homie for keeping the house and the car in shape. Let's get you set up." />
              <View style={local.inner}>
                <Button label="Add a home or vehicle" icon="add" onPress={() => router.push('/asset/new')} />
                <GettingStarted />
                <Card style={local.reasons}>
                  <Text style={[ui.title, { color: t.text }]}>Why upkeep is worth it</Text>
                  {REASONS.map((r) => (
                    <View key={r.title} style={local.reason}>
                      <IconBadge name={r.icon} color={r.color} size={40} />
                      <View style={local.flex}>
                        <Text style={[local.reasonTitle, { color: t.text }]}>{r.title}</Text>
                        <Text style={[ui.sub, { color: t.sub }]}>{r.body}</Text>
                      </View>
                    </View>
                  ))}
                </Card>
                <Button kind="plain" label="Moving in? Import from the previous owner" icon="key-outline" onPress={() => router.push('/import')} />
                <Button kind="plain" label="Track a warranty" icon="shield-checkmark-outline" onPress={() => router.push('/warranty/new')} />
              </View>
            </View>
          }
        />
      </View>
    );
  }

  const sections = GROUPS.map((g) => ({ title: g.title, key: g.key, data: items.filter((i) => i.due.status === g.key) })).filter(
    (s) => s.data.length > 0
  );
  const count = (k: DueItem['due']['status']) => items.filter((i) => i.due.status === k).length;
  const overdue = count('overdue');
  const soon = count('soon');
  const endingSoon = warranties.filter((w) => warrantyInfo(w, today).status === 'soon').length;
  const choresLeft = chores.filter((c) => ['overdue', 'today'].includes(choreDue(c, choreLogs, today).status)).length;
  const renewing = policies.filter((p) => ['soon', 'past'].includes(renewalInfo(p, today).status)).length;
  const score = healthScore(items.map((i) => i.due.status));
  const jobs = logs.length + proJobs.length;
  const lvl = level(jobs);
  const month = today.slice(0, 7);
  const thisMonth = logs.filter((l) => l.doneAt.startsWith(month)).length + proJobs.filter((j) => j.date.startsWith(month)).length;

  const mood: Mood = overdue > 0 ? 'worried' : soon > 0 ? 'okay' : 'happy';
  const title = overdue > 0 ? (overdue === 1 ? '1 job is overdue' : `${overdue} jobs are overdue`) : soon > 0 ? (soon === 1 ? '1 job coming up' : `${soon} jobs coming up`) : 'All caught up';
  const line =
    overdue > 0
      ? "Let's knock one out today. Even a quick one counts."
      : soon > 0
        ? 'Heads up, homie. Nothing late yet, so you are ahead of it.'
        : thisMonth > 0
          ? `Nice work. ${thisMonth} ${thisMonth === 1 ? 'job' : 'jobs'} done this month.`
          : 'Nothing due right now. Kick back.';
  const scoreColor = score >= 75 ? t.primary : score >= 50 ? t.warn : t.danger;

  return (
    <View style={[local.flex, { backgroundColor: t.bg }]}>
      <SectionList
        sections={sections}
        keyExtractor={(i) => i.task.id}
        contentContainerStyle={local.listPad}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={local.header}>
            <Hero mood={mood} title={title} line={line} />
            <View style={local.inner}>
              <Card style={local.health}>
                <View style={[local.ring, { borderColor: scoreColor }]}>
                  <Text style={[local.score, { color: scoreColor }]}>{score}</Text>
                </View>
                <View style={local.flex}>
                  <Text style={[ui.label, { color: t.sub }]}>HOME HEALTH</Text>
                  <Text style={[local.healthLabel, { color: t.text }]}>{healthLabel(score)}</Text>
                  <View style={local.levelRow}>
                    <MaterialCommunityIcons name="trophy-outline" size={16} color={t.warn} />
                    <Text style={[ui.sub, { color: t.text }]}>
                      Level: <Text style={local.bold}>{lvl.name}</Text>
                      {lvl.next ? `  ·  ${lvl.toNext} ${lvl.toNext === 1 ? 'job' : 'jobs'} to ${lvl.next}` : ''}
                    </Text>
                  </View>
                  <View style={[local.track, { backgroundColor: t.muted }]}>
                    <View style={[local.fill, { backgroundColor: t.warn, width: `${Math.round(lvl.progress * 100)}%` }]} />
                  </View>
                </View>
              </Card>

              <View style={local.stats}>
                {[
                  { n: overdue, label: 'Overdue', color: overdue ? t.danger : t.sub },
                  { n: soon, label: 'Due soon', color: soon ? t.warn : t.sub },
                  { n: thisMonth, label: 'Done this month', color: thisMonth ? t.primary : t.sub },
                ].map((s) => (
                  <Card key={s.label} style={local.stat}>
                    <Text style={[local.statN, { color: s.color }]}>{s.n}</Text>
                    <Text style={[local.statLabel, { color: t.sub }]}>{s.label}</Text>
                  </Card>
                ))}
              </View>

              <View style={local.tiles}>
                <Tile
                  icon={season.def.icon as IconName}
                  color={season.def.colors[0]}
                  title={`${season.def.label} list`}
                  sub={season.done === season.total ? 'All done' : `${season.done} of ${season.total} done`}
                  onPress={() => router.push('/seasonal')}
                />
                <Tile
                  icon="account-hard-hat"
                  color="#2D7FD3"
                  title="Pros"
                  sub={contacts.length ? `${contacts.length} saved` : 'Find who to call'}
                  onPress={() => router.push('/pros')}
                />
                <Tile
                  icon="shield-check"
                  color="#7B56D6"
                  title="Warranties"
                  sub={endingSoon ? `${endingSoon} ending soon` : warranties.length ? `${warranties.length} on file` : 'Snap a receipt'}
                  onPress={() => router.push('/warranties')}
                />
                <Tile
                  icon="broom"
                  color="#E07B1F"
                  title="Chores"
                  sub={!members.length ? 'Get the house helping' : choresLeft ? `${choresLeft} to do today` : chores.length ? 'All caught up' : 'Hand some out'}
                  onPress={() => router.push('/chores')}
                />
                <Tile
                  icon="umbrella-outline"
                  color="#1B4E96"
                  title="Insurance"
                  sub={renewing ? `${renewing} renewing soon` : policies.length ? `${policies.length} polic${policies.length === 1 ? 'y' : 'ies'}` : 'Agent and claims'}
                  onPress={() => router.push('/insurance')}
                />
                <Tile
                  icon="folder-file-outline"
                  color="#176B7A"
                  title="Documents"
                  sub={docs.length ? `${docs.length} saved` : 'Deeds, permits, papers'}
                  onPress={() => router.push('/docs')}
                />
                <Tile icon="plus" color="#1F8A63" title="Add" sub="Home or vehicle" onPress={() => router.push('/asset/new')} />
              </View>

              <Card style={local.tip}>
                <Mascot mood="happy" size={52} />
                <View style={local.flex}>
                  <Text style={[ui.label, { color: t.sub }]}>{MASCOT_NAME.toUpperCase()}'S TIP OF THE DAY</Text>
                  <Text style={[local.tipText, { color: t.text }]}>{tipOfDay(today)}</Text>
                </View>
              </Card>

              <GettingStarted />
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={local.inner}>
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
        renderItem={({ item }) => (
          <View style={local.inner}>
            <TaskRow
              task={item.task}
              due={item.due}
              kind={item.asset.kind}
              assetName={item.appliance ? `${item.asset.name}  ·  ${item.appliance.name}` : item.asset.name}
            />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={local.sep} />}
        ListEmptyComponent={<Empty icon="list-outline" title="No tasks" body="Add tasks from the My stuff tab." />}
        ListFooterComponent={
          <View style={[local.inner, local.footer]}>
            <Ionicons name="paw" size={18} color={t.sub} />
          </View>
        }
      />
    </View>
  );
}

const local = StyleSheet.create({
  flex: { flex: 1 },
  listPad: { paddingBottom: 32 },
  header: { gap: 14, marginBottom: 4 },
  inner: { paddingHorizontal: 16 },
  sep: { height: 12 },
  footer: { alignItems: 'center', paddingTop: 20 },
  hero: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 18, paddingBottom: 18, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroText: { flex: 1, gap: 6, paddingBottom: 6 },
  hello: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' },
  heroTitle: { color: '#FFFFFF', fontSize: 27, fontWeight: '800' },
  bubble: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, marginTop: 6, marginRight: -6 },
  bubbleText: { color: '#16201B', fontSize: 14, lineHeight: 19, fontWeight: '500' },
  bubbleTail: {
    position: 'absolute',
    right: -8,
    bottom: 14,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#FFFFFF',
  },
  dog: { marginLeft: 4, marginBottom: -6 },
  health: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  ring: { width: 84, height: 84, borderRadius: 42, borderWidth: 7, alignItems: 'center', justifyContent: 'center' },
  score: { fontSize: 28, fontWeight: '800' },
  healthLabel: { fontSize: 19, fontWeight: '800' },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  bold: { fontWeight: '800' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 6 },
  fill: { height: 6, borderRadius: 3 },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statN: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48%', flexGrow: 1, borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, padding: 14, gap: 6 },
  tileIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  tileTitle: { fontSize: 16, fontWeight: '700' },
  tileSub: { fontSize: 13 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tipText: { fontSize: 15, lineHeight: 21, marginTop: 2 },
  help: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  reasons: { gap: 14 },
  reason: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  reasonTitle: { fontSize: 15, fontWeight: '700' },
});
