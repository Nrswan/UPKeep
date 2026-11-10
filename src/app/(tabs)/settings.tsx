import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, StyleSheet, Switch, Text, View } from 'react-native';

import { Button, Card, confirmAction, Screen, SectionTitle, styles as ui } from '../../components/ui';
import { SHORT_NOTICE } from '../../lib/legal';
import { removePhotos } from '../../lib/photos';
import { DEVELOPER_NAME, TIP_LINKS } from '../../lib/tip';
import { describeBackup, pickData } from '../../lib/backup';
import { exportBackup, pickBackup, restorePhotos } from '../../lib/io';
import { ensurePermission, sendTestReminder } from '../../lib/reminders';
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
      ...s.appliances.flatMap((a) => a.photos),
      ...s.projects.flatMap((p) => p.photos),
      ...s.expenses.flatMap((e) => e.photos),
    ]);
    resetAll();
  };
  const [blocked, setBlocked] = useState(false);
  const [testNote, setTestNote] = useState('');
  const [withPhotos, setWithPhotos] = useState(true);
  const [busy, setBusy] = useState(false);
  const [backupNote, setBackupNote] = useState('');
  const restoreAll = useStore((s) => s.restoreAll);

  const testReminder = async () => {
    const result = await sendTestReminder(5);
    setBlocked(result === 'blocked');
    setTestNote(
      result === 'sent'
        ? 'Sent. It arrives in about 5 seconds. Lock the phone or go to the home screen to see it as a banner.'
        : result === 'blocked'
          ? ''
          : 'Reminders only work in the phone app.'
    );
  };

  const backUp = async () => {
    setBusy(true);
    setBackupNote('');
    try {
      const res = await exportBackup(pickData(useStore.getState()), withPhotos);
      setBackupNote(
        res.missing > 0
          ? `Backup made. ${res.missing} ${res.missing === 1 ? 'photo was' : 'photos were'} missing and left out.`
          : 'Backup made. Save it somewhere off this phone, like iCloud Drive, Google Drive or an email to yourself.'
      );
    } catch {
      setBackupNote('Could not make the backup. Please try again.');
    }
    setBusy(false);
  };

  const restore = async () => {
    setBackupNote('');
    try {
      const backup = await pickBackup();
      if (!backup) return;
      const when = backup.exportedAt ? ` from ${new Date(backup.exportedAt).toLocaleDateString()}` : '';
      confirmAction(
        'Replace everything on this phone?',
        `This backup${when} has ${describeBackup(backup.data)}. Restoring it replaces what is in the app now.`,
        'Restore',
        async () => {
          setBusy(true);
          await restorePhotos(backup.photos);
          restoreAll(backup.data);
          setBusy(false);
          setBackupNote('Restored.');
        }
      );
    } catch (e) {
      setBackupNote(e instanceof Error ? e.message : 'Could not read that file.');
    }
  };

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
    Alert.alert('Erase everything?', 'This removes every home, vehicle, appliance, project, task, warranty, photo and log from this phone. It cannot be undone.', [
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
        <Button small kind="plain" icon="notifications-outline" label="Send a test reminder" onPress={testReminder} />
        {testNote ? <Text style={[local.small, { color: t.text }]}>{testNote}</Text> : null}
      </Card>

      <SectionTitle>Backup</SectionTitle>
      <Card style={local.gap}>
        <Text style={[ui.sub, { color: t.sub }]}>
          Your records live only on this phone. A backup file lets you get them back after a lost, broken or new phone.
        </Text>
        <View style={local.between}>
          <Text style={[ui.sub, { color: t.text }]}>Include photos</Text>
          <Switch value={withPhotos} onValueChange={setWithPhotos} accessibilityLabel="Include photos in the backup" />
        </View>
        <Button icon="cloud-upload-outline" label={busy ? 'Working' : 'Back up now'} disabled={busy} onPress={backUp} />
        <Button kind="plain" icon="cloud-download-outline" label="Restore from a backup" disabled={busy} onPress={restore} />
        {backupNote ? <Text style={[ui.sub, { color: t.text }]}>{backupNote}</Text> : null}
        <Text style={[local.small, { color: t.sub }]}>Backups with many photos can be large. The file is not encrypted, so keep it somewhere private.</Text>
      </Card>

      <SectionTitle>Safety</SectionTitle>
      <Card style={local.gap}>
        <Text style={[ui.sub, { color: t.sub }]}>{SHORT_NOTICE}</Text>
        <Button kind="plain" icon="shield-checkmark-outline" label="Safety notice and disclaimer" onPress={() => router.push('/disclaimer')} />
      </Card>

      <SectionTitle>Your data</SectionTitle>
      <Card style={local.gap}>
        <Text style={[ui.sub, { color: t.sub }]}>
          Everything stays on this phone, photos included. There is no account and nothing is uploaded.
        </Text>
        <Button kind="danger" label="Erase all data" onPress={confirmReset} />
      </Card>

      <SectionTitle>Tip the developer</SectionTitle>
      <Card style={local.gap}>
        <View style={local.tipHead}>
          <View style={[local.tipIcon, { backgroundColor: t.warnBg }]}>
            <Ionicons name="cafe" size={22} color={t.warn} />
          </View>
          <View style={local.tipText}>
            <Text style={[ui.title, { color: t.text }]}>Built by {DEVELOPER_NAME}</Text>
            <Text style={[ui.sub, { color: t.sub }]}>
              Upkeep is a one person project. If it saved you a repair bill or a lost receipt, a tip helps keep it going.
            </Text>
          </View>
        </View>
        {TIP_LINKS.length ? (
          TIP_LINKS.map((l) => (
            <Button key={l.url} kind="plain" icon="heart-outline" label={`Tip with ${l.label}`} onPress={() => Linking.openURL(l.url)} />
          ))
        ) : (
          <Text style={[local.small, { color: t.sub }]}>Tipping is coming soon. Thanks for using Upkeep.</Text>
        )}
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
  tipHead: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  tipIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tipText: { flex: 1, gap: 2 },
  center: { textAlign: 'center', marginTop: 8 },
});
