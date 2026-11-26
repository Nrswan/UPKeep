import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, Stars, tradeLabel } from '../../components/ProBits';
import { Button, Card, confirmAction, Empty, Screen, SectionTitle, styles as ui } from '../../components/ui';
import { dialable, googleUrl, tradeInfo, webUrl } from '../../lib/contacts';
import { money } from '../../lib/diy';
import { formatDate } from '../../lib/due';
import { photoUri, removePhotos } from '../../lib/photos';
import { useStore } from '../../lib/store';
import { useTheme } from '../../lib/theme';

type Row = {
  key: string;
  date: string;
  title: string;
  where?: string;
  cost?: number;
  note?: string;
  photos: string[];
  go: () => void;
  kind: 'job' | 'log';
};

export default function ProDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useStore((s) => s.contacts.find((x) => x.id === id));
  const proJobs = useStore((s) => s.proJobs);
  const logs = useStore((s) => s.logs);
  const tasks = useStore((s) => s.tasks);
  const assets = useStore((s) => s.assets);
  const updateContact = useStore((s) => s.updateContact);
  const removeContact = useStore((s) => s.removeContact);

  if (!c) {
    return (
      <Screen>
        <Empty icon="help-circle-outline" title="Not found" body="This pro was removed." />
      </Screen>
    );
  }

  const assetName = (aid?: string) => assets.find((a) => a.id === aid)?.name;
  const rows: Row[] = [
    ...proJobs
      .filter((j) => j.contactId === c.id)
      .map((j) => ({
        key: j.id,
        date: j.date,
        title: j.title,
        where: assetName(j.assetId),
        cost: j.cost,
        note: j.note,
        photos: j.photos,
        kind: 'job' as const,
        go: () => router.push({ pathname: '/pro/job', params: { id: j.id } }),
      })),
    ...logs
      .filter((l) => l.contactId === c.id)
      .map((l) => ({
        key: l.id,
        date: l.doneAt,
        title: tasks.find((x) => x.id === l.taskId)?.title ?? 'Upkeep job',
        where: assetName(l.assetId),
        cost: l.cost,
        note: l.note,
        photos: l.photos ?? [],
        kind: 'log' as const,
        go: () => router.push({ pathname: '/task/[id]', params: { id: l.taskId } }),
      })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));
  const total = rows.reduce((n, r) => n + Math.round((r.cost ?? 0) * 100), 0) / 100;
  const info = tradeInfo(c.trade);

  const actions: { icon: keyof typeof Ionicons.glyphMap; label: string; url: string }[] = [];
  if (c.phone) {
    actions.push({ icon: 'call', label: 'Call', url: `tel:${dialable(c.phone)}` });
    actions.push({ icon: 'chatbubble', label: 'Text', url: `sms:${dialable(c.phone)}` });
  }
  if (c.email) actions.push({ icon: 'mail', label: 'Email', url: `mailto:${c.email.trim()}` });
  if (c.website) actions.push({ icon: 'globe-outline', label: 'Website', url: webUrl(c.website) });

  const remove = () =>
    confirmAction(`Remove ${c.name}?`, 'Their saved jobs and receipts are removed too. Upkeep you logged as done by them stays in your history.', 'Remove', () => {
      removePhotos(proJobs.filter((j) => j.contactId === c.id).flatMap((j) => j.photos));
      router.back();
      removeContact(c.id);
    });

  return (
    <Screen>
      <Stack.Screen options={{ title: '' }} />

      <Card style={local.head}>
        <Avatar name={c.name} trade={c.trade} size={72} />
        <Text style={[local.name, { color: t.text }]}>{c.name}</Text>
        <Text style={[ui.sub, { color: t.sub }]}>{tradeLabel(c.trade)}</Text>
        <Stars value={c.rating} onChange={(r) => updateContact(c.id, { rating: r })} size={26} />
        {actions.length ? (
          <View style={local.actions}>
            {actions.map((a) => (
              <Pressable
                key={a.label}
                accessibilityRole="button"
                accessibilityLabel={`${a.label} ${c.name}`}
                onPress={() => Linking.openURL(a.url)}
                style={({ pressed }) => [local.action, { backgroundColor: t.okBg, opacity: pressed ? 0.7 : 1 }]}
              >
                <Ionicons name={a.icon} size={22} color={t.primary} />
                <Text style={[local.actionText, { color: t.primary }]}>{a.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={[ui.sub, { color: t.sub }]}>Add a phone number to call or text from here.</Text>
        )}
        {c.phone ? <Text style={[ui.sub, { color: t.text }]}>{c.phone}</Text> : null}
        {c.note ? <Text style={[ui.sub, local.center, { color: t.text }]}>{c.note}</Text> : null}
      </Card>

      <SectionTitle>Jobs and receipts ({rows.length})</SectionTitle>
      {rows.length ? (
        <Text style={[ui.sub, { color: t.sub }]}>
          {money(total)} spent with {c.name}
        </Text>
      ) : (
        <Text style={[ui.sub, { color: t.sub }]}>
          Save each job with the receipt so you have it for warranty claims, taxes or the next time something breaks.
        </Text>
      )}
      {rows.map((r) => (
        <Pressable key={r.key} accessibilityRole="button" accessibilityLabel={`${r.title}, ${formatDate(r.date)}`} onPress={r.go}>
          <Card style={local.job}>
            <View style={local.jobTop}>
              <View style={local.jobText}>
                <Text style={[ui.title, { color: t.text }]}>{r.title}</Text>
                <Text style={[ui.sub, { color: t.sub }]}>
                  {[formatDate(r.date), r.where, r.kind === 'log' ? 'Logged upkeep' : null].filter(Boolean).join('  ·  ')}
                </Text>
              </View>
              {r.cost != null ? <Text style={[local.cost, { color: t.text }]}>{money(r.cost)}</Text> : null}
            </View>
            {r.note ? <Text style={[ui.sub, { color: t.text }]}>{r.note}</Text> : null}
            {r.photos.length ? (
              <View style={local.thumbs}>
                {r.photos.slice(0, 4).map((p) => (
                  <Image key={p} source={{ uri: photoUri(p) }} style={[local.thumb, { backgroundColor: t.muted }]} />
                ))}
                {r.photos.length > 4 ? <Text style={[ui.sub, { color: t.sub }]}>+{r.photos.length - 4}</Text> : null}
              </View>
            ) : null}
          </Card>
        </Pressable>
      ))}

      <Button label="Add a job or receipt" icon="receipt-outline" onPress={() => router.push({ pathname: '/pro/job', params: { contactId: c.id } })} />
      <Button kind="plain" icon="create-outline" label="Edit details" onPress={() => router.push({ pathname: '/pro/new', params: { id: c.id } })} />
      {info ? (
        <Button kind="plain" icon="search" label={`Find another ${info.title}`} onPress={() => Linking.openURL(googleUrl(info.search))} />
      ) : null}
      <Button kind="danger" label={`Remove ${c.name}`} onPress={remove} />
    </Screen>
  );
}

const local = StyleSheet.create({
  head: { alignItems: 'center', gap: 8, paddingVertical: 20 },
  name: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  center: { textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  action: { width: 72, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 4 },
  actionText: { fontSize: 12, fontWeight: '700' },
  job: { gap: 8 },
  jobTop: { flexDirection: 'row', gap: 12 },
  jobText: { flex: 1, gap: 2 },
  cost: { fontSize: 16, fontWeight: '700' },
  thumbs: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  thumb: { width: 56, height: 56, borderRadius: 10 },
});
