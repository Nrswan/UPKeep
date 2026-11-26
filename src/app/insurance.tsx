import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Empty, IconBadge, Screen, SectionTitle, styles as ui } from '../components/ui';
import { dialable } from '../lib/contacts';
import { money } from '../lib/diy';
import { formatDate, todayStr } from '../lib/due';
import { claimStatus, insuranceFacts, policyType, renewalInfo, sortClaims, yearlyPremium } from '../lib/insurance';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import type { Claim, Policy } from '../lib/types';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const AFTER_DAMAGE = [
  'Make it safe first. Shut off water, gas or power if you need to.',
  'Take photos and video of the damage before you clean anything up.',
  'Call the claims number on your policy and write down the claim number.',
  'Stop more damage, like a tarp on the roof, and keep every receipt.',
  'Do not throw out damaged things until the adjuster says it is OK.',
];

export default function InsuranceScreen() {
  const t = useTheme();
  const { assetId } = useLocalSearchParams<{ assetId?: string }>();
  const allPolicies = useStore((s) => s.policies);
  const allClaims = useStore((s) => s.claims);
  const assets = useStore((s) => s.assets);
  const asset = assets.find((a) => a.id === assetId);
  const today = todayStr();

  const policies = assetId ? allPolicies.filter((p) => p.assetId === assetId) : allPolicies;
  const policyIds = new Set(policies.map((p) => p.id));
  const claims = sortClaims(assetId ? allClaims.filter((c) => c.assetId === assetId || (c.policyId && policyIds.has(c.policyId))) : allClaims);
  const places = asset ? [asset] : assets;
  const yearly = policies.reduce((sum, p) => sum + Math.round((yearlyPremium(p) ?? 0) * 100), 0) / 100;

  return (
    <Screen>
      <Stack.Screen options={{ title: asset ? `Insurance  ·  ${asset.name}` : 'Insurance' }} />

      <SectionTitle>Policies{yearly ? `  ·  ${money(yearly, false)} a year` : ''}</SectionTitle>
      {policies.length === 0 ? (
        <Empty icon="shield-checkmark-outline" title="No policies yet" body="Add who you are insured with so the policy number, agent and claims line are one tap away." />
      ) : (
        policies.map((p) => <PolicyCard key={p.id} p={p} place={assetId ? undefined : assets.find((a) => a.id === p.assetId)?.name} today={today} />)
      )}
      <Button icon="add" label="Add a policy" onPress={() => router.push({ pathname: '/policy', params: assetId ? { assetId } : {} })} />

      <SectionTitle>Claims ({claims.length})</SectionTitle>
      {claims.map((c) => (
        <ClaimCard key={c.id} c={c} policy={allPolicies.find((p) => p.id === c.policyId)} />
      ))}
      {claims.length === 0 ? <Text style={[ui.sub, { color: t.sub }]}>No claims. Here is hoping it stays that way.</Text> : null}
      <Button kind="plain" icon="add" label="Log a claim" onPress={() => router.push({ pathname: '/claim', params: assetId ? { assetId } : {} })} />

      {places.length ? (
        <>
          <SectionTitle>Insurance summary PDF</SectionTitle>
          <Text style={[ui.sub, { color: t.sub }]}>
            One page with what agents ask about: the building, roof, systems, safety, updates, upkeep and past claims. Handy for quotes, renewals and claims.
          </Text>
          {places.map((a) => {
            const facts = insuranceFacts(a.kind);
            const have = new Set((a.facts ?? []).filter((f) => f.value.trim()).map((f) => f.label.toLowerCase()));
            const filled = facts.filter((f) => have.has(f.label.toLowerCase())).length;
            return (
              <Pressable
                key={a.id}
                accessibilityRole="button"
                accessibilityLabel={`${a.name} insurance details. ${filled} of ${facts.length} filled in`}
                onPress={() => router.push({ pathname: '/insurance-details', params: { id: a.id } })}
              >
                <Card style={local.row}>
                  <IconBadge name={a.kind === 'home' ? 'home-outline' : 'car-outline'} color={a.kind === 'home' ? '#1F8A63' : '#2D7FD3'} />
                  <View style={local.main}>
                    <Text style={[ui.title, { color: t.text }]}>{a.name}</Text>
                    <Text style={[ui.sub, { color: filled === facts.length ? t.primary : t.sub }]}>
                      {filled === 0 ? 'Answer the questions agents ask' : `${filled} of ${facts.length} details filled in`}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={t.sub} />
                </Card>
              </Pressable>
            );
          })}
        </>
      ) : null}

      <SectionTitle>If something happens</SectionTitle>
      <Card style={local.steps}>
        {AFTER_DAMAGE.map((s, i) => (
          <View key={i} style={local.step}>
            <View style={[local.num, { backgroundColor: t.blueBg }]}>
              <Text style={[local.numText, { color: t.blue }]}>{i + 1}</Text>
            </View>
            <Text style={[ui.sub, local.flex, { color: t.text }]}>{s}</Text>
          </View>
        ))}
      </Card>
      <Text style={[local.small, { color: t.sub }]}>General tips only. Your policy and your insurance company decide what is covered.</Text>
    </Screen>
  );
}

function PolicyCard({ p, place, today }: { p: Policy; place?: string; today: string }) {
  const t = useTheme();
  const type = policyType(p.type);
  const renew = renewalInfo(p, today);
  const renewColor = renew.status === 'past' ? t.danger : renew.status === 'soon' ? t.warn : t.sub;
  const facts = [p.deductible != null ? `${money(p.deductible, false)} deductible` : '', yearlyPremium(p) != null ? `${money(yearlyPremium(p)!, false)} a year` : '']
    .filter(Boolean)
    .join('  ·  ');
  const call = p.claimsPhone || p.agentPhone;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${p.company} ${type.label}. Open`} onPress={() => router.push({ pathname: '/policy', params: { id: p.id } })}>
      <Card style={local.card}>
        <View style={local.row}>
          <IconBadge name={type.icon as IconName} color={type.color} />
          <View style={local.main}>
            <Text style={[ui.title, { color: t.text }]} numberOfLines={1}>
              {p.company}
            </Text>
            <Text style={[ui.sub, { color: t.sub }]} numberOfLines={1}>
              {[type.label, place, p.policyNumber ? `#${p.policyNumber}` : ''].filter(Boolean).join('  ·  ')}
            </Text>
            {facts ? <Text style={[ui.sub, { color: t.text }]}>{facts}</Text> : null}
            <Text style={[local.meta, { color: renewColor }]}>{renew.label}</Text>
          </View>
        </View>
        {call ? (
          <View style={ui.row}>
            {p.claimsPhone ? (
              <Button small kind="plain" icon="call-outline" label="Claims line" onPress={() => Linking.openURL(`tel:${dialable(p.claimsPhone!)}`)} />
            ) : null}
            {p.agentPhone ? (
              <Button small kind="plain" icon="person-outline" label={p.agentName ? `Call ${p.agentName.split(' ')[0]}` : 'Call agent'} onPress={() => Linking.openURL(`tel:${dialable(p.agentPhone!)}`)} />
            ) : null}
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}

function ClaimCard({ c, policy }: { c: Claim; policy?: Policy }) {
  const t = useTheme();
  const status = claimStatus(c.status);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${c.title}. ${status.label}. Open`} onPress={() => router.push({ pathname: '/claim', params: { id: c.id } })}>
      <Card style={local.row}>
        <IconBadge name="file-alert-outline" color={status.open ? '#E07B1F' : '#5E6B64'} />
        <View style={local.main}>
          <Text style={[ui.title, { color: t.text }]} numberOfLines={1}>
            {c.title}
          </Text>
          <Text style={[ui.sub, { color: t.sub }]} numberOfLines={1}>
            {[formatDate(c.date), policy?.company, c.claimNumber ? `#${c.claimNumber}` : ''].filter(Boolean).join('  ·  ')}
          </Text>
          <Text style={[local.meta, { color: status.open ? t.warn : t.sub }]}>
            {c.paid != null && c.status === 'paid' ? `Paid ${money(c.paid)}` : `${status.label}${c.paid != null ? `  ·  ${money(c.paid)} paid` : ''}`}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

const local = StyleSheet.create({
  card: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  main: { flex: 1, gap: 2 },
  meta: { fontSize: 12, fontWeight: '600' },
  steps: { gap: 10 },
  step: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  num: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 13, fontWeight: '700' },
  flex: { flex: 1 },
  small: { fontSize: 12, textAlign: 'center' },
});
