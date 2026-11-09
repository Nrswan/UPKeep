import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type ApplianceChoices, AppliancePicker, chosenAppliances, countApplianceTasks } from '../../components/AppliancePicker';
import { PhotoStrip } from '../../components/PhotoStrip';
import { Select } from '../../components/Select';
import { Button, Card, Field, Screen, SectionTitle, styles as ui, toNumber } from '../../components/ui';
import { describeInterval } from '../../lib/due';
import { ELECTRIC_MAKES, PRESETS } from '../../lib/presets';
import { ensurePermission } from '../../lib/reminders';
import { useStore } from '../../lib/store';
import { useTheme } from '../../lib/theme';
import type { AssetKind } from '../../lib/types';
import { fetchModels, MAKES, vehicleLabel, YEARS } from '../../lib/vehicles';

export default function NewAsset() {
  const t = useTheme();
  const addAsset = useStore((s) => s.addAsset);
  const remindersOn = useStore((s) => s.settings.remindersOn);
  const updateSettings = useStore((s) => s.updateSettings);

  const [kind, setKind] = useState<AssetKind>('home');
  const [name, setName] = useState('');
  const [nameEdited, setNameEdited] = useState(false);
  const [mileage, setMileage] = useState('');
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [appliances, setAppliances] = useState<ApplianceChoices>({});
  // Presets the user switched by hand. Anything not in here follows the default.
  const [toggled, setToggled] = useState<Record<string, boolean>>({});

  // Look up models whenever year and make are both set.
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

  // Keep the name in step with the picked vehicle until the user types their own.
  const autoName = vehicleLabel({ year, make, model });
  const shownName = kind === 'vehicle' && !nameEdited ? autoName : name;

  const electric = kind === 'vehicle' && ELECTRIC_MAKES.includes(make);
  const presets = PRESETS[kind];
  const key = (title: string) => `${kind}:${title}`;
  const isOn = (p: (typeof presets)[number]) => toggled[key(p.title)] ?? !(electric && p.engine);
  const picked = presets.filter(isOn);
  const miles = toNumber(mileage);
  const canSave = shownName.trim().length > 0 && (kind === 'home' || miles != null);

  const save = async () => {
    const id = addAsset({
      kind,
      name: shownName,
      mileage: kind === 'vehicle' && miles != null ? Math.round(miles) : undefined,
      year: year ? Number(year) : undefined,
      make: make || undefined,
      model: model || undefined,
      photo: photos[0],
      presets: picked,
      appliances: kind === 'home' ? chosenAppliances(appliances) : undefined,
    });
    // Ask for notification permission at the moment it makes sense to the user.
    if (remindersOn) {
      const ok = await ensurePermission();
      if (!ok) updateSettings({ remindersOn: false });
    }
    router.replace({ pathname: '/asset/[id]', params: { id } });
  };

  return (
    <Screen>
      <View style={local.kinds}>
        {(['home', 'vehicle'] as const).map((k) => {
          const active = kind === k;
          return (
            <Pressable
              key={k}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setKind(k)}
              style={[local.kind, { backgroundColor: active ? t.okBg : t.card, borderColor: active ? t.primary : t.line }]}
            >
              <Ionicons name={k === 'home' ? 'home' : 'car'} size={26} color={active ? t.primary : t.sub} />
              <Text style={[ui.title, { color: active ? t.primary : t.text }]}>{k === 'home' ? 'Home' : 'Vehicle'}</Text>
            </Pressable>
          );
        })}
      </View>

      {kind === 'vehicle' ? (
        <>
          <View style={local.pair}>
            <View style={local.year}>
              <Select label="Year" value={year} options={YEARS} placeholder="Year" onChange={(v) => { setYear(v); setModel(''); }} />
            </View>
            <View style={local.make}>
              <Select
                label="Make"
                value={make}
                options={MAKES}
                placeholder="Make"
                allowCustom
                onChange={(v) => { setMake(v); setModel(''); }}
              />
            </View>
          </View>
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
        </>
      ) : null}

      <Field
        label="Name"
        value={shownName}
        onChangeText={(v) => {
          setName(v);
          setNameEdited(true);
        }}
        placeholder={kind === 'home' ? 'Our house' : 'Daily driver'}
        autoCapitalize="words"
        returnKeyType="done"
      />
      {kind === 'vehicle' ? (
        <Field
          label="Current mileage"
          value={mileage}
          onChangeText={setMileage}
          placeholder="84500"
          keyboardType="number-pad"
          hint="Used to track tasks that depend on miles driven."
        />
      ) : null}

      <PhotoStrip label="Photo (optional)" photos={photos} onChange={(p) => setPhotos(p.slice(-1))} />

      {kind === 'home' ? (
        <>
          <SectionTitle>What is in your home?</SectionTitle>
          <Text style={[ui.sub, { color: t.sub }]}>
            Pick the type you have and the right upkeep is added. Skip any you do not have. You can add more later with photos and
            model numbers.
          </Text>
          <AppliancePicker value={appliances} onChange={setAppliances} />
          {countApplianceTasks(appliances) > 0 ? (
            <Text style={[ui.sub, { color: t.primary }]}>
              {countApplianceTasks(appliances)} appliance {countApplianceTasks(appliances) === 1 ? 'task' : 'tasks'} will be added.
            </Text>
          ) : null}
        </>
      ) : null}

      <SectionTitle>{kind === 'home' ? 'House tasks' : 'Starter schedule'} ({picked.length})</SectionTitle>
      <Text style={[ui.sub, { color: t.sub }]}>
        {kind === 'vehicle'
          ? 'A general schedule, not the factory one for this model. Turn off what does not apply and set intervals from your owner\'s manual.'
          : 'Turn off anything that does not apply. You can change intervals later.'}
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
              <View style={local.itemText}>
                <Text style={[local.itemTitle, { color: on ? t.text : t.sub }]}>{p.title}</Text>
                <Text style={[local.itemSub, { color: t.sub }]}>{describeInterval(p)}</Text>
              </View>
            </Pressable>
          );
        })}
      </Card>

      <Button label={kind === 'home' ? 'Add home' : 'Add vehicle'} disabled={!canSave} onPress={save} />
    </Screen>
  );
}

const local = StyleSheet.create({
  kinds: { flexDirection: 'row', gap: 12 },
  kind: { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 18, alignItems: 'center', gap: 6 },
  pair: { flexDirection: 'row', gap: 12 },
  year: { flex: 2 },
  make: { flex: 3 },
  list: { paddingVertical: 2 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, minHeight: 48 },
  itemText: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: '500' },
  itemSub: { fontSize: 13, marginTop: 1 },
});
