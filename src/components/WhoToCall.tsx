import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { dialable, googleUrl, HIRING_TIPS, searchFor, tradeInfo } from '../lib/contacts';
import type { EffortLevel } from '../lib/effort';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import { Avatar, Stars } from './ProBits';
import { Button, Card, styles as ui } from './ui';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/**
 * Who to call for a job: the right kind of pro, your saved ones first, a
 * Google search for new ones and what to look for when hiring.
 */
export function WhoToCall({ title, trade, level }: { title: string; trade: string; level?: EffortLevel }) {
  const t = useTheme();
  const contacts = useStore((s) => s.contacts);
  const [showTips, setShowTips] = useState(false);
  const info = tradeInfo(trade);
  const query = searchFor(title, trade);
  const saved = contacts.filter((c) => c.trade === trade).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 3);
  const who = info ? `${info.article === 'an' ? 'An' : 'A'} ${info.title}` : trade;

  return (
    <Card style={local.card}>
      <Text style={[ui.label, { color: t.sub }]}>{level === 'pro' ? 'WHO TO CALL' : 'RATHER HIRE IT OUT?'}</Text>
      <View style={local.head}>
        <View style={[local.icon, { backgroundColor: `${info?.color ?? t.blue}22` }]}>
          <MaterialCommunityIcons name={(info?.icon ?? 'account-hard-hat') as IconName} size={26} color={info?.color ?? t.blue} />
        </View>
        <View style={local.headText}>
          <Text style={[local.who, { color: t.text }]}>{who}</Text>
          <Text style={[ui.sub, { color: t.sub }]}>
            {saved.length ? 'From your pros' : level === 'pro' ? 'This is the kind of pro to look for.' : 'This is who handles it if you would rather not.'}
          </Text>
        </View>
      </View>

      {saved.map((c) => (
        <View key={c.id} style={[local.pro, { borderTopColor: t.line }]}>
          <Pressable
            style={local.proMain}
            accessibilityRole="button"
            accessibilityLabel={`${c.name}. Open`}
            onPress={() => router.push({ pathname: '/pro/[id]', params: { id: c.id } })}
          >
            <Avatar name={c.name} trade={c.trade} size={38} />
            <View style={local.headText}>
              <Text style={[ui.title, { color: t.text }]} numberOfLines={1}>
                {c.name}
              </Text>
              {c.rating ? <Stars value={c.rating} size={13} /> : null}
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
        </View>
      ))}

      {query ? (
        <Button kind={saved.length ? 'plain' : 'primary'} icon="search" label={`Search Google for "${query}"`} onPress={() => Linking.openURL(googleUrl(query))} />
      ) : null}

      <Pressable accessibilityRole="button" onPress={() => setShowTips((v) => !v)} style={local.toggle}>
        <Ionicons name={showTips ? 'chevron-up' : 'checkmark-done-outline'} size={18} color={t.primary} />
        <Text style={[local.toggleText, { color: t.primary }]}>{showTips ? 'Hide' : 'What to look for when hiring'}</Text>
      </Pressable>
      {showTips ? (
        <View style={local.tips}>
          {[...HIRING_TIPS, ...(info?.tips ?? [])].map((tip) => (
            <View key={tip} style={local.tip}>
              <Ionicons name="checkmark-circle-outline" size={18} color={t.primary} style={local.tipIcon} />
              <Text style={[local.tipText, { color: t.text }]}>{tip}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Button
        small
        kind="plain"
        icon="person-add-outline"
        label={saved.length ? 'Save another pro' : 'Save a pro you like'}
        onPress={() => router.push({ pathname: '/pro/new', params: { trade } })}
      />
    </Card>
  );
}

const local = StyleSheet.create({
  card: { gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headText: { flex: 1, gap: 2 },
  who: { fontSize: 19, fontWeight: '800' },
  pro: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10 },
  proMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  call: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36 },
  toggleText: { fontSize: 15, fontWeight: '600' },
  tips: { gap: 8 },
  tip: { flexDirection: 'row', gap: 8 },
  tipIcon: { marginTop: 1 },
  tipText: { flex: 1, fontSize: 14, lineHeight: 20 },
});
