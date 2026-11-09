import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { TaskForm } from '../../components/TaskForm';
import { Button, Card, DateStepper, Empty, Field, Screen, SectionTitle, StatusPill, styles as ui, toNumber } from '../../components/ui';
import { computeDue, describeInterval, formatDate, latestLog, todayStr } from '../../lib/due';
import { useStore } from '../../lib/store';
import { useTheme } from '../../lib/theme';

export default function TaskDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const task = useStore((s) => s.tasks.find((x) => x.id === id));
  const asset = useStore((s) => s.assets.find((a) => a.id === task?.assetId));
  const allLogs = useStore((s) => s.logs);
  const leadDays = useStore((s) => s.settings.leadDays);
  const logDone = useStore((s) => s.logDone);
  const removeLog = useStore((s) => s.removeLog);
  const updateTask = useStore((s) => s.updateTask);
  const removeTask = useStore((s) => s.removeTask);

  const [mode, setMode] = useState<'view' | 'log' | 'edit'>('view');
  const [doneAt, setDoneAt] = useState(todayStr());
  const [miles, setMiles] = useState('');
  const [cost, setCost] = useState('');
  const [note, setNote] = useState('');

  const history = useMemo(
    () => allLogs.filter((l) => l.taskId === id).sort((a, b) => (a.doneAt < b.doneAt ? 1 : -1)),
    [allLogs, id]
  );

  if (!task || !asset) {
    return (
      <Screen>
        <Empty icon="help-circle-outline" title="Not found" body="This task was removed." />
      </Screen>
    );
  }

  const due = computeDue(task, latestLog(allLogs, task.id), asset, todayStr(), leadDays);
  const isVehicle = asset.kind === 'vehicle';

  const openLog = () => {
    setDoneAt(todayStr());
    setMiles(asset.mileage != null ? String(asset.mileage) : '');
    setCost('');
    setNote('');
    setMode('log');
  };

  const saveLog = () => {
    const m = toNumber(miles);
    logDone(task.id, { doneAt, miles: isVehicle && m != null ? Math.round(m) : undefined, cost: toNumber(cost), note });
    setMode('view');
  };

  const confirmRemove = () =>
    Alert.alert('Delete this task?', 'Its history is deleted too.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          router.back();
          removeTask(task.id);
        },
      },
    ]);

  return (
    <Screen>
      <Stack.Screen options={{ title: asset.name }} />

      <Card style={local.gap}>
        <Text style={[local.heading, { color: t.text }]}>{task.title}</Text>
        <StatusPill status={due.status} label={due.label} />
        <Text style={[ui.sub, { color: t.sub }]}>{describeInterval(task)}</Text>
        {due.dueDate ? <Text style={[ui.sub, { color: t.sub }]}>Next by date: {formatDate(due.dueDate)}</Text> : null}
        {due.dueMiles != null ? (
          <Text style={[ui.sub, { color: t.sub }]}>Next by mileage: {due.dueMiles.toLocaleString()} mi</Text>
        ) : null}
        {task.note ? <Text style={[ui.sub, { color: t.text }]}>{task.note}</Text> : null}
      </Card>

      {mode === 'view' ? (
        <>
          <Button label="Mark done" icon="checkmark" onPress={openLog} />
          <Button kind="plain" label="Edit task" icon="create-outline" onPress={() => setMode('edit')} />
        </>
      ) : null}

      {mode === 'log' ? (
        <Card style={local.gap}>
          <DateStepper value={doneAt} onChange={setDoneAt} />
          {isVehicle ? (
            <Field label="Mileage at the time" value={miles} onChangeText={setMiles} keyboardType="number-pad" placeholder="Odometer reading" />
          ) : null}
          <Field label="Cost (optional)" value={cost} onChangeText={setCost} keyboardType="decimal-pad" placeholder="0.00" />
          <Field label="Note (optional)" value={note} onChangeText={setNote} placeholder="Parts used, shop, anything worth remembering" />
          <Button label="Save" onPress={saveLog} />
          <Button kind="plain" label="Cancel" onPress={() => setMode('view')} />
        </Card>
      ) : null}

      {mode === 'edit' ? (
        <Card style={local.gap}>
          <TaskForm
            kind={asset.kind}
            initial={task}
            submitLabel="Save changes"
            onSubmit={(v) => {
              updateTask(task.id, v);
              setMode('view');
            }}
          />
          <Button kind="plain" label="Cancel" onPress={() => setMode('view')} />
          <Button kind="danger" label="Delete task" onPress={confirmRemove} />
        </Card>
      ) : null}

      <SectionTitle>History ({history.length})</SectionTitle>
      {history.length === 0 ? <Text style={[ui.sub, { color: t.sub }]}>Nothing logged yet.</Text> : null}
      {history.map((l) => (
        <Card key={l.id} style={local.log}>
          <View style={local.logMain}>
            <Text style={[ui.title, { color: t.text }]}>{formatDate(l.doneAt)}</Text>
            <Text style={[ui.sub, { color: t.sub }]}>
              {[
                l.miles != null ? `${l.miles.toLocaleString()} mi` : null,
                l.cost != null ? `$${l.cost.toFixed(2)}` : null,
                l.note,
              ]
                .filter(Boolean)
                .join('  ·  ') || 'Done'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Delete entry from ${formatDate(l.doneAt)}`}
            hitSlop={10}
            onPress={() => removeLog(l.id)}
          >
            <Ionicons name="trash-outline" size={20} color={t.sub} />
          </Pressable>
        </Card>
      ))}
    </Screen>
  );
}

const local = StyleSheet.create({
  gap: { gap: 10 },
  heading: { fontSize: 22, fontWeight: '800' },
  log: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logMain: { flex: 1, gap: 2 },
});
