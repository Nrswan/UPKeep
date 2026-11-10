import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Banner } from '../components/Banner';
import { Button, Card, Screen, styles as ui } from '../components/ui';
import { todayStr } from '../lib/due';
import { itemsFor, type Season, seasonForMonth, seasonKey, SEASONS } from '../lib/seasons';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import { useSeasonContext } from '../lib/useSeason';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export default function SeasonalScreen() {
  const t = useTheme();
  const today = todayStr();
  const current = seasonForMonth(Number(today.slice(5, 7)));
  const [season, setSeason] = useState<Season>(current);
  const checks = useStore((s) => s.seasonChecks);
  const toggle = useStore((s) => s.toggleSeasonItem);
  const ctx = useSeasonContext();

  const def = SEASONS.find((s) => s.key === season)!;
  const items = itemsFor(season, ctx);
  // Checkmarks are kept per year. Other seasons use this calendar year.
  const key = season === current ? seasonKey(today) : `${today.slice(0, 4)}-${season}`;
  const done = new Set(checks[key] ?? []);
  const doneCount = items.filter((i) => done.has(i.id)).length;

  return (
    <Screen>
      <View style={ui.row}>
        {SEASONS.map((s) => (
          <Button key={s.key} small kind={season === s.key ? 'primary' : 'plain'} label={s.label} onPress={() => setSeason(s.key)} />
        ))}
      </View>

      <Banner
        colors={def.colors}
        icon={def.icon as IconName}
        height={130}
        title={`${def.label} checklist`}
        subtitle={`${def.months}  ·  ${doneCount} of ${items.length} done${season === current ? '' : '  ·  not the current season'}`}
      />

      <Card style={local.list}>
        {items.map((i, n) => {
          const on = done.has(i.id);
          return (
            <Pressable
              key={i.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={i.title}
              onPress={() => toggle(key, i.id)}
              style={[local.item, n > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line }]}
            >
              <Ionicons name={on ? 'checkbox' : 'square-outline'} size={26} color={on ? t.primary : t.sub} style={local.box} />
              <View style={local.text}>
                <Text style={[local.title, { color: on ? t.sub : t.text }, on && local.struck]}>{i.title}</Text>
                <Text style={[local.why, { color: t.sub }]}>{i.why}</Text>
              </View>
            </Pressable>
          );
        })}
      </Card>

      <Text style={[local.note, { color: t.sub }]}>
        The list fits what you have added. Add your appliances and vehicles to see more. Seasons follow the Northern Hemisphere.
      </Text>
    </Screen>
  );
}

const local = StyleSheet.create({
  list: { paddingVertical: 2 },
  item: { flexDirection: 'row', gap: 12, paddingVertical: 12 },
  box: { marginTop: 1 },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 16, fontWeight: '600', lineHeight: 21 },
  why: { fontSize: 13, lineHeight: 18 },
  struck: { textDecorationLine: 'line-through', fontWeight: '400' },
  note: { fontSize: 12, lineHeight: 17, textAlign: 'center' },
});
