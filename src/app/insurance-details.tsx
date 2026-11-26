import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { Button, Card, Empty, Field, Screen, SectionTitle, styles as ui } from '../components/ui';
import { todayStr } from '../lib/due';
import { insuranceFacts } from '../lib/insurance';
import { insurancePhotoNames, buildInsuranceHtml } from '../lib/insuranceReport';
import { photoDataUris, shareReport } from '../lib/io';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import type { Spec } from '../lib/types';

/**
 * The questions an insurance agent asks about a home or vehicle, saved with
 * its other facts, and the button that turns it all into a PDF.
 */
export default function InsuranceDetails() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useStore();
  const asset = state.assets.find((a) => a.id === id);
  const facts = useMemo(() => (asset ? insuranceFacts(asset.kind) : []), [asset]);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const f of asset?.facts ?? []) out[f.label.toLowerCase()] = f.value;
    return out;
  });
  const [hideCosts, setHideCosts] = useState(false);
  const [withPhotos, setWithPhotos] = useState(true);
  const [busy, setBusy] = useState(false);

  if (!asset) {
    return (
      <Screen>
        <Empty icon="help-circle-outline" title="Not found" body="This home or vehicle was removed." />
      </Screen>
    );
  }

  const groups = [...new Set(facts.map((f) => f.group))];
  const filled = facts.filter((f) => values[f.label.toLowerCase()]?.trim()).length;
  const policies = state.policies.filter((p) => p.assetId === asset.id).length;

  /** Keeps the home's other facts and replaces the insurance ones. */
  const saveFacts = () => {
    const mine = new Set(facts.map((f) => f.label.toLowerCase()));
    const kept = (asset.facts ?? []).filter((f) => !mine.has(f.label.toLowerCase()));
    const next: Spec[] = [
      ...kept,
      ...facts.map((f) => ({ label: f.label, value: (values[f.label.toLowerCase()] ?? '').trim() })).filter((f) => f.value),
    ];
    state.updateAsset(asset.id, { facts: next });
    return next;
  };

  const makePdf = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const nextFacts = saveFacts();
      const input = {
        asset: { ...asset, facts: nextFacts },
        policies: state.policies,
        claims: state.claims,
        appliances: state.appliances,
        warranties: state.warranties,
        projects: state.projects,
        expenses: state.expenses,
        proJobs: state.proJobs,
        contacts: state.contacts,
        tasks: state.tasks,
        logs: state.logs,
        docs: state.docs,
        today: todayStr(),
        hideCosts,
      };
      const photoSrc = withPhotos ? await photoDataUris(insurancePhotoNames(input)) : undefined;
      await shareReport(buildInsuranceHtml({ ...input, photoSrc }), asset.name, 'insurance');
    } catch {
      Alert.alert('Could not make the PDF', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: `Insurance details  ·  ${asset.name}` }} />
      <Text style={[ui.sub, { color: t.sub }]}>
        These are the questions agents ask when they quote, renew or handle a claim. Fill in what you know. Skip the rest. {filled} of {facts.length} filled in.
      </Text>

      {groups.map((g) => (
        <View key={g} style={local.group}>
          <SectionTitle>{g}</SectionTitle>
          {facts
            .filter((f) => f.group === g)
            .map((f) => (
              <Field
                key={f.label}
                label={f.label}
                value={values[f.label.toLowerCase()] ?? ''}
                onChangeText={(v) => setValues((s) => ({ ...s, [f.label.toLowerCase()]: v }))}
                placeholder={f.hint}
                keyboardType={/\(year\)|Year built|Square feet|Stories|Miles driven/.test(f.label) ? 'numbers-and-punctuation' : 'default'}
                autoCapitalize="sentences"
              />
            ))}
        </View>
      ))}

      <Button kind="plain" label="Save answers" onPress={() => { saveFacts(); router.back(); }} />

      <SectionTitle>Insurance summary PDF</SectionTitle>
      <Card style={local.opts}>
        <Text style={[ui.sub, { color: t.text }]}>
          Includes {policies ? `${policies} polic${policies === 1 ? 'y' : 'ies'}, ` : ''}the answers above, appliances, updates by you and your pros, 3 years of upkeep, warranties, documents on file and claims from the last 5 years.
        </Text>
        <View style={local.opt}>
          <Text style={[ui.sub, local.flex, { color: t.text }]}>Leave out prices and amounts</Text>
          <Switch value={hideCosts} onValueChange={setHideCosts} accessibilityLabel="Leave out prices and amounts" />
        </View>
        <View style={local.opt}>
          <Text style={[ui.sub, local.flex, { color: t.text }]}>Add photos of the place, claims and appliances</Text>
          <Switch value={withPhotos} onValueChange={setWithPhotos} accessibilityLabel="Add photos" />
        </View>
      </Card>
      <Button icon="document-text-outline" label={busy ? 'Working' : 'Make insurance PDF'} disabled={busy} onPress={makePdf} />
      <Text style={[local.small, { color: t.sub }]}>Read it over before you send it. It only shows what you entered.</Text>
    </Screen>
  );
}

const local = StyleSheet.create({
  group: { gap: 12 },
  opts: { gap: 12 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  small: { fontSize: 12, textAlign: 'center' },
});
