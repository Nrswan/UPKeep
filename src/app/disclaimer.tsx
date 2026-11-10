import { StyleSheet, Text, View } from 'react-native';

import { Card, Screen } from '../components/ui';
import { formatDate, toDateStr } from '../lib/due';
import { DISCLAIMER } from '../lib/legal';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';

export default function DisclaimerScreen() {
  const t = useTheme();
  const acceptedAt = useStore((s) => s.settings.disclaimerAcceptedAt);

  return (
    <Screen>
      {DISCLAIMER.map((s) => (
        <Card key={s.title} style={local.card}>
          <Text style={[local.title, { color: t.text }]}>{s.title}</Text>
          <Text style={[local.body, { color: t.sub }]}>{s.body}</Text>
        </Card>
      ))}
      {acceptedAt ? (
        <View>
          <Text style={[local.note, { color: t.sub }]}>You agreed to this on {formatDate(toDateStr(new Date(acceptedAt)))}.</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const local = StyleSheet.create({
  card: { gap: 6 },
  title: { fontSize: 16, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22 },
  note: { fontSize: 12, textAlign: 'center' },
});
