import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, Empty, Field, IconBadge, Screen, SectionTitle, styles as ui } from '../../components/ui';
import { APPLIANCES } from '../../lib/appliances';
import { useStore } from '../../lib/store';
import { useTheme } from '../../lib/theme';

export default function NewAppliance() {
  const t = useTheme();
  const { assetId } = useLocalSearchParams<{ assetId: string }>();
  const asset = useStore((s) => s.assets.find((a) => a.id === assetId));
  const addAppliance = useStore((s) => s.addAppliance);
  const [custom, setCustom] = useState('');

  if (!asset) {
    return (
      <Screen>
        <Empty icon="help-circle-outline" title="Not found" body="Add a home first." />
      </Screen>
    );
  }

  const add = (category: string, option: string, name?: string) => {
    const id = addAppliance({ assetId: asset.id, category, option, name });
    router.replace({ pathname: '/appliance/[id]', params: { id } });
  };

  return (
    <Screen>
      <Text style={[ui.sub, { color: t.sub }]}>Pick the type you have. Its upkeep tasks are added for you and you can change them later.</Text>

      {APPLIANCES.map((c) => (
        <Card key={c.key} style={local.row}>
          <IconBadge name={c.icon} color={c.color} size={38} />
          <View style={local.main}>
            <Text style={[local.label, { color: t.text }]}>{c.label}</Text>
            <View style={ui.row}>
              {c.options.map((o) => (
                <Button
                  key={o.key}
                  small
                  kind="plain"
                  icon="add"
                  label={c.options.length === 1 ? `Add ${o.label.toLowerCase()}` : o.chip}
                  onPress={() => add(c.key, o.key)}
                />
              ))}
            </View>
          </View>
        </Card>
      ))}

      <SectionTitle>Something else</SectionTitle>
      <Field label="Name" value={custom} onChangeText={setCustom} placeholder="Garage door opener, sump pump, pool pump" autoCapitalize="words" />
      <Button label="Add appliance" disabled={!custom.trim()} onPress={() => add('other', 'other', custom)} />
    </Screen>
  );
}

const local = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  main: { flex: 1, gap: 8 },
  label: { fontSize: 16, fontWeight: '600' },
});
