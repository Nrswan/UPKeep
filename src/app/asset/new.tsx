import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type Answer, ApplianceQuestion, NONE } from '../../components/ApplianceQuestion';
import { PhotoStrip } from '../../components/PhotoStrip';
import { Select } from '../../components/Select';
import { Button, Card, Field, IconBadge, styles as ui, toNumber } from '../../components/ui';
import { APPLIANCES, findOption, UNSURE } from '../../lib/appliances';
import { describeInterval } from '../../lib/due';
import { ELECTRIC_MAKES, PRESETS } from '../../lib/presets';
import { ensurePermission } from '../../lib/reminders';
import { useStore } from '../../lib/store';
import { useTheme } from '../../lib/theme';
import type { AssetKind } from '../../lib/types';
import { fetchModels, MAKES, vehicleLabel, YEARS } from '../../lib/vehicles';

/**
 * Adding a home or vehicle, one question per screen so nothing gets skipped
 * by accident. Each appliance needs an answer before moving on, and "I'm not
 * sure" is always a fine answer.
 */
type Step = 'kind' | 'home-name' | `ap:${string}` | 'vehicle-ymm' | 'vehicle-details' | 'tasks' | 'review';

function stepsFor(kind: AssetKind): Step[] {
  return kind === 'home'
    ? ['kind', 'home-name', ...APPLIANCES.map((c) => `ap:${c.key}` as Step), 'tasks', 'review']
    : ['kind', 'vehicle-ymm', 'vehicle-details', 'tasks', 'review'];
}

export default function NewAsset() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollViewInstance>(null);
  const addAsset = useStore((s) => s.addAsset);
  const remindersOn = useStore((s) => s.settings.remindersOn);
  const updateSettings = useStore((s) => s.updateSettings);

  const [kind, setKind] = useState<AssetKind>('home');
  const [index, setIndex] = useState(0);
  const [name, setName] = useState('');
  const [nameEdited, setNameEdited] = useState(false);
  const [mileage, setMileage] = useState('');
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  // Presets the user switched by hand. Anything not in here follows the default.
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  // Set when the owner taps an answer on the review screen to change it.
  const [fromReview, setFromReview] = useState(false);

  useEffect(() => {
    if (!year || !make) {
      setModels([]);
      return;
    }
    let live = true;
    setLoadingModels(true);
    fetchModels(make, year).then((list) => {
      if (!live) return;
      setModels(list);
      setLoadingModels(false);
    });
    return () => {
      live = false;
    };
  }, [year, make]);

  const steps = stepsFor(kind);
  const step = steps[index];
  const last = index === steps.length - 1;

  // Start each step at the top.
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [index]);

  const autoName = vehicleLabel({ year, make, model });
  const shownName = kind === 'vehicle' && !nameEdited ? autoName : name;
  const miles = toNumber(mileage);

  const electric = kind === 'vehicle' && ELECTRIC_MAKES.includes(make);
  const presets = PRESETS[kind];
  const key = (title: string) => `${kind}:${title}`;
  const isOn = (p: (typeof presets)[number]) => toggled[key(p.title)] ?? !(electric && p.engine);
  const picked = presets.filter(isOn);

  const chosen = APPLIANCES.flatMap((c) =>
    (answers[c.key] ?? []).filter((a) => a !== NONE).map((option) => ({ category: c.key, option }))
  );
  const applianceTaskCount = chosen.reduce((n, a) => n + (findOption(a.category, a.option)?.tasks.length ?? 0), 0);

  const canGo = (() => {
    if (step === 'home-name') return name.trim().length > 0;
    if (step.startsWith('ap:')) return (answers[step.slice(3)] ?? []).length > 0;
    if (step === 'vehicle-details') return shownName.trim().length > 0 && miles != null;
    return !saving;
  })();

  const reviewIndex = steps.indexOf('review');
  const back = () => {
    if (fromReview) {
      setFromReview(false);
      setIndex(reviewIndex);
    } else if (index === 0) router.back();
    else setIndex(index - 1);
  };

  const next = async () => {
    if (!canGo) return;
    if (fromReview) {
      setFromReview(false);
      setIndex(reviewIndex);
      return;
    }
    if (!last) {
      setIndex(index + 1);
      return;
    }
    setSaving(true);
    const id = addAsset({
      kind,
      name: shownName,
      mileage: kind === 'vehicle' && miles != null ? Math.round(miles) : undefined,
      year: year ? Number(year) : undefined,
      make: make || undefined,
      model: model || undefined,
      photo: photos[0],
      presets: picked,
      appliances: kind === 'home' ? chosen : undefined,
    });
    if (remindersOn) {
      const ok = await ensurePermission();
      if (!ok) updateSettings({ remindersOn: false });
    }
    router.replace({ pathname: '/asset/[id]', params: { id } });
  };

  const nextLabel = fromReview
    ? 'Back to review'
    : last
    ? kind === 'home'
      ? 'Add home'
      : 'Add vehicle'
    : step === 'vehicle-ymm' && !year && !make
      ? 'Skip for now'
      : 'Next';

  return (
    <KeyboardAvoidingView
      style={[local.flex, { backgroundColor: t.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen options={{ title: index === 0 ? 'Add a home or vehicle' : kind === 'home' ? 'Add a home' : 'Add a vehicle' }} />

      <View style={local.progressWrap}>
        <View style={[local.track, { backgroundColor: t.muted }]}>
          <View style={[local.fill, { backgroundColor: t.primary, width: `${((index + 1) / steps.length) * 100}%` }]} />
        </View>
        <Text style={[local.stepText, { color: t.sub }]}>
          Step {index + 1} of {steps.length}
        </Text>
      </View>

      <ScrollView ref={scroll} contentContainerStyle={local.body} keyboardShouldPersistTaps="handled">
        {step === 'kind' ? (
          <>
            <Text style={[local.question, { color: t.text }]}>What would you like to add?</Text>
            {(['home', 'vehicle'] as const).map((k) => {
              const on = kind === k;
              return (
                <Pressable
                  key={k}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={k === 'home' ? 'A home' : 'A vehicle'}
                  onPress={() => {
                    setKind(k);
                    setToggled({});
                  }}
                  style={[local.bigChoice, { backgroundColor: on ? t.okBg : t.card, borderColor: on ? t.primary : t.line }]}
                >
                  <Ionicons name={k === 'home' ? 'home' : 'car'} size={34} color={on ? t.primary : t.sub} />
                  <View style={local.flex}>
                    <Text style={[local.bigLabel, { color: on ? t.primary : t.text }]}>{k === 'home' ? 'A home' : 'A vehicle'}</Text>
                    <Text style={[ui.sub, { color: t.sub }]}>
                      {k === 'home' ? 'We will walk through your appliances one at a time.' : 'Track oil changes and more by date or mileage.'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </>
        ) : null}

        {step === 'home-name' ? (
          <>
            <Text style={[local.question, { color: t.text }]}>What do you call this home?</Text>
            <Field label="Name" value={name} onChangeText={setName} placeholder="Our house, the rental on Elm" autoCapitalize="words" />
            <PhotoStrip label="Photo of the house (optional)" photos={photos} onChange={(p) => setPhotos(p.slice(-1))} />
            <Text style={[ui.sub, { color: t.sub }]}>
              Next we will ask about each appliance, one at a time. If you are not sure what you have, that is fine. We will show you
              how to check.
            </Text>
          </>
        ) : null}

        {step.startsWith('ap:') ? (
          <ApplianceQuestion
            key={step}
            category={step.slice(3)}
            value={answers[step.slice(3)] ?? []}
            onChange={(v) => setAnswers((a) => ({ ...a, [step.slice(3)]: v }))}
          />
        ) : null}

        {step === 'vehicle-ymm' ? (
          <>
            <Text style={[local.question, { color: t.text }]}>What vehicle is it?</Text>
            <Text style={[ui.sub, { color: t.sub }]}>The year is on your registration or insurance card if you are not sure.</Text>
            <Select label="Year" value={year} options={YEARS} placeholder="Year" onChange={(v) => { setYear(v); setModel(''); }} />
            <Select label="Make" value={make} options={MAKES} placeholder="Make" allowCustom onChange={(v) => { setMake(v); setModel(''); }} />
            <Select
              label="Model"
              value={model}
              options={models}
              placeholder={!year || !make ? 'Pick year and make first' : 'Model'}
              disabled={!year || !make}
              loading={loadingModels}
              allowCustom
              emptyText="No models found. Type yours in the box above."
              onChange={setModel}
            />
            {electric ? <Text style={[ui.sub, { color: t.primary }]}>Electric vehicle. Engine jobs like oil changes will be left off.</Text> : null}
          </>
        ) : null}

        {step === 'vehicle-details' ? (
          <>
            <Text style={[local.question, { color: t.text }]}>A couple of details</Text>
            <Field
              label="Name"
              value={shownName}
              onChangeText={(v) => {
                setName(v);
                setNameEdited(true);
              }}
              placeholder="Daily driver"
              autoCapitalize="words"
            />
            <Field
              label="Current mileage"
              value={mileage}
              onChangeText={setMileage}
              placeholder="84500"
              keyboardType="number-pad"
              hint="It is on the dashboard, usually labeled ODO. Close enough is fine."
            />
            <PhotoStrip label="Photo (optional)" photos={photos} onChange={(p) => setPhotos(p.slice(-1))} />
          </>
        ) : null}

        {step === 'tasks' ? (
          <>
            <Text style={[local.question, { color: t.text }]}>{kind === 'home' ? 'General house jobs' : 'Starter schedule'}</Text>
            <Text style={[ui.sub, { color: t.sub }]}>
              {kind === 'home'
                ? 'These apply to almost every home. Turn off any that do not fit yours.'
                : "A general schedule, not the factory one for this model. Turn off what does not apply. You can match intervals to your owner's manual later."}
            </Text>
            <Card style={local.list}>
              {presets.map((p, i) => {
                const on = isOn(p);
                return (
                  <Pressable
                    key={p.title}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    onPress={() => setToggled((o) => ({ ...o, [key(p.title)]: !on }))}
                    style={[local.item, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line }]}
                  >
                    <Ionicons name={on ? 'checkbox' : 'square-outline'} size={24} color={on ? t.primary : t.sub} />
                    <View style={local.flex}>
                      <Text style={[local.itemTitle, { color: on ? t.text : t.sub }]}>{p.title}</Text>
                      <Text style={[local.itemSub, { color: t.sub }]}>{describeInterval(p)}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </Card>
          </>
        ) : null}

        {step === 'review' ? (
          <>
            <Text style={[local.question, { color: t.text }]}>Look right?</Text>
            <Card style={local.gap}>
              <Text style={[ui.title, { color: t.text }]}>{shownName}</Text>
              {kind === 'vehicle' ? (
                <Text style={[ui.sub, { color: t.sub }]}>
                  {[autoName && autoName !== shownName ? autoName : '', miles != null ? `${Math.round(miles).toLocaleString()} miles` : '']
                    .filter(Boolean)
                    .join('  ·  ')}
                </Text>
              ) : null}
              <Text style={[ui.sub, { color: t.sub }]}>
                {picked.length + applianceTaskCount} upkeep {picked.length + applianceTaskCount === 1 ? 'task' : 'tasks'} will be added.
              </Text>
            </Card>

            {kind === 'home' ? (
              <Card style={local.gap}>
                <Text style={[ui.label, { color: t.sub }]}>APPLIANCES</Text>
                {APPLIANCES.map((c) => {
                  const a = answers[c.key] ?? [];
                  const text = a.includes(NONE)
                    ? 'None'
                    : a.includes(UNSURE)
                      ? 'Not sure yet'
                      : a.map((o) => findOption(c.key, o)?.label ?? o).join(' and ');
                  return (
                    <Pressable
                      key={c.key}
                      accessibilityRole="button"
                      accessibilityLabel={`${c.label}: ${text}. Tap to change`}
                      onPress={() => {
                        setFromReview(true);
                        setIndex(steps.indexOf(`ap:${c.key}`));
                      }}
                      style={local.reviewRow}
                    >
                      <IconBadge name={c.icon} color={c.color} size={34} />
                      <Text style={[local.reviewLabel, { color: t.text }]}>{c.label}</Text>
                      <Text
                        style={[local.reviewValue, { color: a.includes(UNSURE) ? t.warn : a.includes(NONE) ? t.sub : t.text }]}
                        numberOfLines={2}
                      >
                        {text}
                      </Text>
                      <Ionicons name="create-outline" size={18} color={t.sub} />
                    </Pressable>
                  );
                })}
              </Card>
            ) : null}

            {kind === 'home' && chosen.some((a) => a.option === UNSURE) ? (
              <Text style={[ui.sub, { color: t.sub }]}>
                Anything marked not sure gets the upkeep that fits every type. Open it from your home any time to see how to check and set
                the type.
              </Text>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <View style={[local.footer, { borderTopColor: t.line, backgroundColor: t.bg, paddingBottom: insets.bottom + 10 }]}>
        <View style={local.footerBack}>
          <Button kind="plain" label={index === 0 ? 'Cancel' : 'Back'} onPress={back} />
        </View>
        <View style={local.footerNext}>
          <Button label={nextLabel} disabled={!canGo} onPress={next} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const local = StyleSheet.create({
  flex: { flex: 1 },
  progressWrap: { paddingHorizontal: 16, paddingTop: 8, gap: 6 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  stepText: { fontSize: 12, fontWeight: '600' },
  body: { padding: 16, paddingBottom: 32, gap: 14 },
  question: { fontSize: 24, fontWeight: '800' },
  bigChoice: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1.5, borderRadius: 16, padding: 18 },
  bigLabel: { fontSize: 19, fontWeight: '700' },
  list: { paddingVertical: 2 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, minHeight: 48 },
  itemTitle: { fontSize: 16, fontWeight: '500' },
  itemSub: { fontSize: 13, marginTop: 1 },
  gap: { gap: 10 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  reviewLabel: { fontSize: 15, fontWeight: '600', width: 104 },
  reviewValue: { flex: 1, fontSize: 15, textAlign: 'right' },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  footerBack: { flex: 1 },
  footerNext: { flex: 2 },
});
