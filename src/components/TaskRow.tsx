import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import type { DueInfo, Task } from '../lib/types';
import { Card, StatusPill, styles as ui } from './ui';

export function TaskRow({ task, due, assetName }: { task: Task; due: DueInfo; assetName?: string }) {
  const t = useTheme();
  const logDone = useStore((s) => s.logDone);
  return (
    <Card style={local.row}>
      <Pressable
        style={local.main}
        accessibilityRole="button"
        accessibilityLabel={`${task.title}. ${due.label}`}
        onPress={() => router.push({ pathname: '/task/[id]', params: { id: task.id } })}
      >
        <Text style={[ui.title, { color: t.text }]} numberOfLines={2}>
          {task.title}
        </Text>
        {assetName ? <Text style={[ui.sub, { color: t.sub }]}>{assetName}</Text> : null}
        <StatusPill status={due.status} label={due.status === 'unlogged' ? `Not logged yet. ${due.label}` : due.label} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Mark ${task.title} done today`}
        hitSlop={8}
        onPress={() => logDone(task.id)}
        style={({ pressed }) => [local.check, { borderColor: t.primary, opacity: pressed ? 0.5 : 1 }]}
      >
        <Ionicons name="checkmark" size={24} color={t.primary} />
      </Pressable>
    </Card>
  );
}

const local = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  main: { flex: 1, gap: 6 },
  check: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
