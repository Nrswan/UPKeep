import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Select } from '../../components/Select';
import { Button, Card, Empty, Field, Screen, styles as ui } from '../../components/ui';
import { useStore } from '../../lib/store';
import { useTheme } from '../../lib/theme';
import { fetchModels, MAKES, YEARS } from '../../lib/vehicles';

export default function EditAsset() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const asset = useStore((s) => s.assets.find((a) => a.id === id));
  const updateAsset = useStore((s) => s.updateAsset);

  const [name, setName] = useState(asset?.name ?? '');
  const [year, setYear] = useState(asset?.year ? String(asset.year) : '');
  const [make, setMake] = useState(asset?.make ?? '');
  const [model, setModel] = useState(asset?.model ?? '');
  const [rental, setRental] = useState(!!asset?.rental);
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!year || !make) {
      setModels([]);
      return;
    }
    let live = true;
    setLoading(true);
    fetchModels(make, year).then((list) => {
      if (!live) return;
      setModels(list);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [year, make]);

  if (!asset) {
    return (
      <Screen>
        <Empty icon="help-circle-outline" title="Not found" body="This item was removed." />
      </Screen>
    );
  }

  const save = () => {
    updateAsset(asset.id, {
      name: name.trim(),
      ...(asset.kind === 'vehicle'
        ? { year: year ? Number(year) : undefined, make: make || undefined, model: model || undefined }
        : { rental }),
    });
    router.back();
  };

  return (
    <Screen>
      <Field label="Name" value={name} onChangeText={setName} autoCapitalize="words" />

      {asset.kind === 'vehicle' ? (
        <>
          <View style={local.pair}>
            <View style={local.year}>
              <Select label="Year" value={year} options={YEARS} placeholder="Year" onChange={(v) => { setYear(v); setModel(''); }} />
            </View>
            <View style={local.make}>
              <Select label="Make" value={make} options={MAKES} placeholder="Make" allowCustom onChange={(v) => { setMake(v); setModel(''); }} />
            </View>
          </View>
          <Select
            label="Model"
            value={model}
            options={models}
            placeholder={!year || !make ? 'Pick year and make first' : 'Model'}
            disabled={!year || !make}
            loading={loading}
            allowCustom
            emptyText="No models found. Type yours in the box above."
            onChange={setModel}
          />
        </>
      ) : (
        <Card style={local.rental}>
          <View style={local.rentalText}>
            <Text style={[ui.title, { color: t.text }]}>This is a rental property</Text>
            <Text style={[ui.sub, { color: t.sub }]}>
              Adds spots for tenant and lease details and marks the property on your list and reports.
            </Text>
          </View>
          <Switch value={rental} onValueChange={setRental} accessibilityLabel="This is a rental property" />
        </Card>
      )}

      <Button label="Save" disabled={!name.trim()} onPress={save} />
    </Screen>
  );
}

const local = StyleSheet.create({
  pair: { flexDirection: 'row', gap: 12 },
  year: { flex: 2 },
  make: { flex: 3 },
  rental: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rentalText: { flex: 1, gap: 2 },
});
