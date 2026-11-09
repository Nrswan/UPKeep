import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Empty, Field, Screen, SectionTitle, toNumber } from '../../components/ui';
import { ROOMS } from '../../lib/diy';
import { useStore } from '../../lib/store';
import { useTheme } from '../../lib/theme';

export default function NewProject() {
  const t = useTheme();
  const { assetId } = useLocalSearchParams<{ assetId: string }>();
  const asset = useStore((s) => s.assets.find((a) => a.id === assetId));
  const addProject = useStore((s) => s.addProject);

  const [room, setRoom] = useState('');
  const [roomName, setRoomName] = useState('');
  const [name, setName] = useState('');
  const [nameEdited, setNameEdited] = useState(false);
  const [budget, setBudget] = useState('');

  if (!asset) {
    return (
      <Screen>
        <Empty icon="help-circle-outline" title="Not found" body="Add a home first." />
      </Screen>
    );
  }

  const label = room === 'other' ? roomName.trim() : (ROOMS.find((r) => r.key === room)?.label ?? '');
  const autoName = label ? `${label} remodel` : '';
  const shownName = nameEdited ? name : autoName;
  const canSave = room !== '' && shownName.trim().length > 0 && (room !== 'other' || roomName.trim().length > 0);

  const save = () => {
    const id = addProject({
      assetId: asset.id,
      name: shownName.trim(),
      room,
      roomName: room === 'other' ? roomName.trim() : undefined,
      budget: toNumber(budget),
    });
    router.replace({ pathname: '/project/[id]', params: { id } });
  };

  return (
    <Screen>
      <SectionTitle>What are you working on?</SectionTitle>
      <View style={local.grid}>
        {[...ROOMS, { key: 'other', label: 'Other', icon: 'hammer-wrench' as const }].map((r) => {
          const active = room === r.key;
          return (
            <Pressable
              key={r.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={r.label}
              onPress={() => setRoom(r.key)}
              style={[local.room, { backgroundColor: active ? t.okBg : t.card, borderColor: active ? t.primary : t.line }]}
            >
              <MaterialCommunityIcons name={r.icon} size={26} color={active ? t.primary : t.sub} />
              <Text style={[local.roomLabel, { color: active ? t.primary : t.text }]} numberOfLines={2}>
                {r.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {room === 'other' ? (
        <Field label="Which room or area?" value={roomName} onChangeText={setRoomName} placeholder="Sunroom, shed, pantry" autoCapitalize="words" />
      ) : null}

      <Field
        label="Project name"
        value={shownName}
        onChangeText={(v) => {
          setName(v);
          setNameEdited(true);
        }}
        placeholder="Bathroom remodel"
        autoCapitalize="sentences"
      />
      <Field
        label="Budget (optional)"
        value={budget}
        onChangeText={setBudget}
        placeholder="2500"
        keyboardType="decimal-pad"
        hint="Set one to see how much you have left as you log receipts."
      />
      <Button label="Start project" disabled={!canSave} onPress={save} />
    </Screen>
  );
}

const local = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  room: { width: '31%', flexGrow: 1, minHeight: 84, borderWidth: 1.5, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8 },
  roomLabel: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
