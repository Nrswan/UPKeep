import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { Question } from '../lib/identify';
import { useTheme } from '../lib/theme';
import { Button, styles as ui } from './ui';

/**
 * Signs that tell one type from another. With onPick, each type gets a button
 * so the owner can set it right after checking.
 */
export function IdentifyGuide({ q, current, onPick }: { q: Question; current?: string; onPick?: (option: string) => void }) {
  const t = useTheme();
  return (
    <View style={local.wrap}>
      {q.guide.map((g) => (
        <View key={g.option} style={[local.group, { borderColor: current === g.option ? t.primary : t.line, backgroundColor: t.card }]}>
          <Text style={[local.title, { color: t.text }]}>{g.title}</Text>
          {g.signs.map((s) => (
            <View key={s} style={local.sign}>
              <Ionicons name="eye-outline" size={16} color={t.sub} style={local.bullet} />
              <Text style={[local.signText, { color: t.text }]}>{s}</Text>
            </View>
          ))}
          {onPick ? (
            current === g.option ? (
              <Text style={[ui.sub, { color: t.primary }]}>This is what you have now</Text>
            ) : (
              <Button small kind="plain" icon="checkmark" label={`Mine is ${g.title.split(' (')[0].toLowerCase()}`} onPress={() => onPick(g.option)} />
            )
          ) : null}
        </View>
      ))}
      {q.tips.map((tip) => (
        <View key={tip} style={[local.tip, { backgroundColor: t.blueBg }]}>
          <Ionicons name="bulb-outline" size={18} color={t.blue} />
          <Text style={[local.tipText, { color: t.text }]}>{tip}</Text>
        </View>
      ))}
      {q.safety ? (
        <View style={[local.tip, { backgroundColor: t.warnBg }]}>
          <Ionicons name="warning-outline" size={18} color={t.warn} />
          <Text style={[local.tipText, { color: t.text }]}>{q.safety}</Text>
        </View>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  wrap: { gap: 10 },
  group: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  title: { fontSize: 16, fontWeight: '700' },
  sign: { flexDirection: 'row', gap: 8 },
  bullet: { marginTop: 3 },
  signText: { flex: 1, fontSize: 15, lineHeight: 21 },
  tip: { flexDirection: 'row', gap: 10, borderRadius: 12, padding: 12 },
  tipText: { flex: 1, fontSize: 14, lineHeight: 20 },
});
