import { Ionicons } from '@expo/vector-icons';
import { type ReactNode, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DISCLAIMER, DISCLAIMER_VERSION, KEY_POINTS } from '../lib/legal';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import { Button } from './ui';

/**
 * Shows the safety notice before anything else until the user agrees to the
 * current version. The date and version of that agreement are saved.
 */
export function DisclaimerGate({ children }: { children: ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const accepted = useStore((s) => s.settings.disclaimerVersion);
  const updateSettings = useStore((s) => s.updateSettings);
  const [full, setFull] = useState(false);

  if (accepted != null && accepted >= DISCLAIMER_VERSION) return <>{children}</>;

  return (
    <View style={[local.wrap, { backgroundColor: t.bg, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 12 }]}>
      <ScrollView contentContainerStyle={local.scroll}>
        <View style={[local.icon, { backgroundColor: t.warnBg }]}>
          <Ionicons name="shield-checkmark" size={34} color={t.warn} />
        </View>
        <Text style={[local.title, { color: t.text }]}>Before you start</Text>
        <Text style={[local.lead, { color: t.sub }]}>
          Upkeep helps you remember and understand maintenance. Doing the work safely is up to you.
        </Text>

        {KEY_POINTS.map((p) => (
          <View key={p} style={local.point}>
            <Ionicons name="checkmark-circle" size={20} color={t.primary} style={local.tick} />
            <Text style={[local.pointText, { color: t.text }]}>{p}</Text>
          </View>
        ))}

        {full ? (
          DISCLAIMER.map((s) => (
            <View key={s.title} style={local.section}>
              <Text style={[local.sectionTitle, { color: t.text }]}>{s.title}</Text>
              <Text style={[local.sectionBody, { color: t.sub }]}>{s.body}</Text>
            </View>
          ))
        ) : (
          <Button kind="plain" label="Read the full safety notice and disclaimer" onPress={() => setFull(true)} />
        )}
      </ScrollView>

      <View style={[local.footer, { borderTopColor: t.line }]}>
        <Text style={[local.agree, { color: t.sub }]}>
          By tapping the button you agree to the full safety notice and disclaimer.
        </Text>
        <Button
          label="I understand and agree"
          onPress={() => updateSettings({ disclaimerVersion: DISCLAIMER_VERSION, disclaimerAcceptedAt: new Date().toISOString() })}
        />
      </View>
    </View>
  );
}

const local = StyleSheet.create({
  wrap: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 20, gap: 14 },
  icon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800' },
  lead: { fontSize: 16, lineHeight: 23 },
  point: { flexDirection: 'row', gap: 10 },
  tick: { marginTop: 2 },
  pointText: { flex: 1, fontSize: 16, lineHeight: 23 },
  section: { gap: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionBody: { fontSize: 14, lineHeight: 21 },
  footer: { paddingHorizontal: 20, paddingTop: 12, gap: 10, borderTopWidth: StyleSheet.hairlineWidth },
  agree: { fontSize: 12, lineHeight: 17, textAlign: 'center' },
});
