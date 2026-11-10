import { useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';

import { fetchRecalls, type Recall, RECALL_LOOKUP_URL } from '../lib/recalls';
import { useTheme } from '../lib/theme';
import type { Asset } from '../lib/types';
import { Button, Card, styles as ui } from './ui';

type State = { status: 'idle' } | { status: 'loading' } | { status: 'failed' } | { status: 'done'; recalls: Recall[] };

/** Looks up safety recalls for a vehicle's year, make and model. */
export function RecallCard({ asset }: { asset: Asset }) {
  const t = useTheme();
  const [state, setState] = useState<State>({ status: 'idle' });
  const [showAll, setShowAll] = useState(false);
  const ready = !!(asset.year && asset.make && asset.model);

  const check = async () => {
    setState({ status: 'loading' });
    const res = await fetchRecalls(asset.make!, asset.model!, asset.year!);
    setState(res.ok ? { status: 'done', recalls: res.recalls } : { status: 'failed' });
  };

  const recalls = state.status === 'done' ? state.recalls : [];
  const shown = showAll ? recalls : recalls.slice(0, 3);

  return (
    <Card style={local.gap}>
      <Text style={[ui.label, { color: t.sub }]}>SAFETY RECALLS</Text>

      {!ready ? (
        <Text style={[ui.sub, { color: t.sub }]}>Add the year, make and model with Edit to check for safety recalls.</Text>
      ) : state.status === 'idle' ? (
        <Text style={[ui.sub, { color: t.sub }]}>
          See the recalls the government has on file for the {asset.year} {asset.make} {asset.model}. Recall repairs are free at the dealer.
        </Text>
      ) : null}

      {state.status === 'loading' ? (
        <View style={local.loading}>
          <ActivityIndicator color={t.primary} />
          <Text style={[ui.sub, { color: t.sub }]}>Checking NHTSA</Text>
        </View>
      ) : null}

      {state.status === 'failed' ? (
        <Text style={[ui.sub, { color: t.danger }]}>Could not reach the recall database. Check your connection and try again.</Text>
      ) : null}

      {state.status === 'done' ? (
        <>
          <Text style={[ui.title, { color: recalls.length ? t.danger : t.primary }]}>
            {recalls.length === 0
              ? 'No recalls on file for this model'
              : recalls.length === 1
                ? '1 recall on file for this model'
                : `${recalls.length} recalls on file for this model`}
          </Text>
          {shown.map((r) => (
            <View key={r.campaign || r.summary} style={[local.recall, { borderTopColor: t.line }]}>
              <Text style={[local.component, { color: t.text }]}>{r.component || 'Recall'}</Text>
              {r.summary ? <Text style={[ui.sub, { color: t.sub }]}>{r.summary}</Text> : null}
              {r.remedy ? <Text style={[ui.sub, { color: t.text }]}>Fix: {r.remedy}</Text> : null}
              <Text style={[local.meta, { color: t.sub }]}>{[r.campaign && `Campaign ${r.campaign}`, r.reported].filter(Boolean).join('  ·  ')}</Text>
            </View>
          ))}
          {recalls.length > 3 && !showAll ? (
            <Button small kind="plain" label={`Show all ${recalls.length}`} onPress={() => setShowAll(true)} />
          ) : null}
          <Text style={[local.meta, { color: t.sub }]}>
            This list covers the model in general. Your vehicle may not be affected or may already be fixed. Check your VIN to be sure.
          </Text>
        </>
      ) : null}

      {ready && state.status !== 'loading' ? (
        <Button
          small
          kind="plain"
          icon="shield-outline"
          label={state.status === 'idle' ? 'Check for safety recalls' : 'Check again'}
          onPress={check}
        />
      ) : null}
      {state.status === 'done' || state.status === 'failed' ? (
        <Button small kind="plain" icon="open-outline" label="Check by VIN at NHTSA" onPress={() => Linking.openURL(RECALL_LOOKUP_URL)} />
      ) : null}
    </Card>
  );
}

const local = StyleSheet.create({
  gap: { gap: 10 },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recall: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, gap: 4 },
  component: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 12, lineHeight: 17 },
});
