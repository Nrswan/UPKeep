import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { findCategory, UNSURE } from '../lib/appliances';
import { questionFor } from '../lib/identify';
import { useTheme } from '../lib/theme';
import { IdentifyGuide } from './IdentifyGuide';
import { Button, IconBadge, styles as ui } from './ui';

/** Answer for one appliance: the types picked, or ["none"], or ["unsure"]. */
export type Answer = string[];
export const NONE = 'none';

/** One setup screen: a single appliance question with clear choices. */
export function ApplianceQuestion({ category, value, onChange }: { category: string; value: Answer; onChange: (v: Answer) => void }) {
  const t = useTheme();
  const c = findCategory(category);
  const q = questionFor(category);
  const [showGuide, setShowGuide] = useState(false);
  if (!c || !q) return null;

  const single = c.options.length === 1;
  const has = (k: string) => value.includes(k);

  const pick = (k: string) => {
    if (k === NONE || k === UNSURE) {
      onChange([k]);
      if (k === UNSURE) setShowGuide(true);
      return;
    }
    const types = value.filter((x) => x !== NONE && x !== UNSURE);
    if (q.multi) onChange(has(k) ? types.filter((x) => x !== k) : [...types, k]);
    else onChange([k]);
  };

  const choices: { key: string; label: string; sub?: string }[] = single
    ? [
        { key: c.options[0].key, label: 'Yes, I have one' },
        { key: NONE, label: 'No' },
      ]
    : [
        ...c.options.map((o) => ({ key: o.key, label: o.label })),
        { key: NONE, label: `I don't have ${category === 'cooling' || category === 'heating' ? 'this' : 'one'}` },
        { key: UNSURE, label: "I'm not sure", sub: 'We will add the upkeep that fits any type and show you how to check.' },
      ];

  return (
    <View style={local.wrap}>
      <View style={local.head}>
        <IconBadge name={c.icon} color={c.color} size={56} />
        <Text style={[local.question, { color: t.text }]}>{q.question}</Text>
        {q.help ? <Text style={[local.help, { color: t.sub }]}>{q.help}</Text> : null}
        {q.multi ? <Text style={[local.help, { color: t.primary }]}>You can pick more than one.</Text> : null}
      </View>

      <View style={local.choices}>
        {choices.map((ch) => {
          const on = has(ch.key);
          const box = q.multi && ch.key !== NONE && ch.key !== UNSURE;
          return (
            <Pressable
              key={ch.key}
              accessibilityRole={box ? 'checkbox' : 'radio'}
              accessibilityState={box ? { checked: on } : { selected: on }}
              accessibilityLabel={ch.label}
              onPress={() => pick(ch.key)}
              style={[local.choice, { backgroundColor: on ? t.okBg : t.card, borderColor: on ? t.primary : t.line }]}
            >
              <Ionicons
                name={box ? (on ? 'checkbox' : 'square-outline') : on ? 'radio-button-on' : 'radio-button-off'}
                size={24}
                color={on ? t.primary : t.sub}
              />
              <View style={local.choiceText}>
                <Text style={[local.choiceLabel, { color: on ? t.primary : t.text }]}>{ch.label}</Text>
                {ch.sub ? <Text style={[ui.sub, { color: t.sub }]}>{ch.sub}</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {q.guide.length ? (
        <>
          <Button
            kind="plain"
            icon={showGuide ? 'chevron-up' : 'help-circle-outline'}
            label={showGuide ? 'Hide how to tell' : 'How to tell what I have'}
            onPress={() => setShowGuide((v) => !v)}
          />
          {showGuide ? <IdentifyGuide q={q} /> : null}
        </>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  wrap: { gap: 16 },
  head: { alignItems: 'center', gap: 8, paddingTop: 8 },
  question: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  help: { fontSize: 15, lineHeight: 21, textAlign: 'center' },
  choices: { gap: 10 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 14, padding: 14, minHeight: 56 },
  choiceText: { flex: 1, gap: 2 },
  choiceLabel: { fontSize: 17, fontWeight: '600' },
});
