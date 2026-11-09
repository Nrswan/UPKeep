import { useState } from 'react';
import { Alert, Linking, StyleSheet, Switch, Text, View } from 'react-native';

import { Button, Card, Screen, SectionTitle, styles as ui } from '../../components/ui';
import { removePhotos } from '../../lib/photos';
import { ensurePermission } from '../../lib/reminders';
import { useStore } from '../../lib/store';
import { useTheme } from '../../lib/theme';

const LEAD_OPTIONS = [0, 1, 3, 7, 14];

export default function SettingsScreen() {
  const t = useTheme();
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetAll = useStore((s) => s.resetAll);

  const eraseAll = () => {
    const s = useStore.getState();
    removePhotos([
      ...s.assets.map((a) => a.photo),
      ...s.logs.flatMap((l) => l.photos ?? []),
      ...s.warranties.flatMap((w) => w.photos),
    ]);
    resetAll();
  };
  const [blocked, setBlocked] = useState(false);

  const toggleReminders = async (on: boolean) => {
    if (!on) {
      updateSettings({ remindersOn: false });
      return;
    }
    const ok = await ensurePermission();
    setBlocked(!ok);
    updateSettings({ remindersOn: ok });
  };

  const confirmReset = () =>
    Alert.alert('Erase everything?', 'This removes every home, vehicle, task, warranty, photo and log from this phone. It cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Erase', style: 'destructive', onPress: eraseAll },
    ]);

  return (
    <Screen>
      <SectionTitle>Reminders</SectionTitle>
      <Card style={local.gap}>
        <View style={local.between}>
          <Text style={[ui.title, { color: t.text }]}>Notify me</Text>
          <Switch value={settings.remindersOn} onValueChange={toggleReminders} accessibilityLabel="Reminders" />
        </View>
        {blocked ? (
          <View style={local.gap}>
            <Text style={[ui.sub, { color: t.danger }]}>Notifications are turned off for Upkeep in your phone settings.</Text>
            <Button small kind="plain" label="Open phone settings" onPress={() => Linking.openSettings()} />
          </View>
        ) : null}
        <Text style={[ui.sub, { color: t.sub }]}>Heads-up before a task is due</Text>
        <View style={ui.row}>
          {LEAD_OPTIONS.map((d) => (
            <Button
              key={d}
              small
              kind={settings.leadDays === d ? 'primary' : 'plain'}
              label={d === 0 ? 'Same day' : d === 1 ? '1 day' : `${d} days`}
              onPress={() => updateSettings({ leadDays: d })}
            />
          ))}
        </View>
        <Text style={[local.small, { color: t.sub }]}>
          Reminders arrive at 9 AM. Warranties alert 30 days before they end. Mileage tasks only alert by date, so keep each vehicle's odometer current.
        </Text>
      </Card>

      <SectionTitle>Your data</SectionTitle>
      <Card style={local.gap}>
        <Text style={[ui.sub, { color: t.sub }]}>
          Everything stays on this phone, photos included. There is no account and nothing is uploaded.
        </Text>
        <Button kind="danger" label="Erase all data" onPress={confirmReset} />
      </Card>

      <Text style={[local.small, local.center, { color: t.sub }]}>
        Starter schedules are general rules of thumb. Check your owner's manual for exact intervals.
      </Text>
    </Screen>
  );
}

const local = StyleSheet.create({
  gap: { gap: 12 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  small: { fontSize: 12, lineHeight: 17 },
  center: { textAlign: 'center', marginTop: 8 },
});
