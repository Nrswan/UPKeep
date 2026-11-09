import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Banner, BannerStat } from '../../components/Banner';
import { PhotoStrip } from '../../components/PhotoStrip';
import { Button, Card, DateStepper, Empty, Field, Screen, SectionTitle, styles as ui, toNumber } from '../../components/ui';
import { categoriesFor, findRoom, money, projectTotals } from '../../lib/diy';
import { formatDate, todayStr } from '../../lib/due';
import { removePhotos } from '../../lib/photos';
import { useStore } from '../../lib/store';
import { gradients, useTheme } from '../../lib/theme';
import type { Expense } from '../../lib/types';

const OTHER = '__other__';

export default function ProjectDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const project = useStore((s) => s.projects.find((p) => p.id === id));
  const home = useStore((s) => s.assets.find((a) => a.id === project?.assetId));
  const allExpenses = useStore((s) => s.expenses);
  const { updateProject, removeProject, addExpense, updateExpense, removeExpense } = useStore.getState();

  const expenses = useMemo(
    () => allExpenses.filter((e) => e.projectId === id).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [allExpenses, id]
  );
  const totals = useMemo(() => projectTotals(expenses), [expenses]);

  // Expense form. editingId is set when changing an existing entry.
  const [mode, setMode] = useState<'view' | 'expense' | 'edit'>('view');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [store, setStore] = useState('');
  const [date, setDate] = useState(todayStr());
  const [photos, setPhotos] = useState<string[]>([]);
  // Project edit form.
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [note, setNote] = useState('');

  if (!project || !home) {
    return (
      <Screen>
        <Empty icon="help-circle-outline" title="Not found" body="This project was removed." />
      </Screen>
    );
  }

  const room = findRoom(project.room);
  const roomLabel = project.roomName ?? room.label;
  const categories = categoriesFor(
    project.room,
    expenses.map((e) => e.category)
  );
  const left = project.budget != null ? project.budget - totals.total : undefined;

  const openExpense = (preset?: string, existing?: Expense) => {
    setEditingId(existing?.id ?? null);
    setCategory(existing?.category ?? preset ?? '');
    setCustomCategory('');
    setAmount(existing ? String(existing.amount) : '');
    setDescription(existing?.description ?? '');
    setStore(existing?.store ?? '');
    setDate(existing?.date ?? todayStr());
    setPhotos(existing?.photos ?? []);
    setMode('expense');
  };

  const finalCategory = category === OTHER ? customCategory.trim() : category;
  const value = toNumber(amount);
  const canSaveExpense = finalCategory.length > 0 && value != null && value > 0;

  const saveExpense = () => {
    if (!canSaveExpense || value == null) return;
    const data = {
      category: finalCategory,
      amount: Math.round(value * 100) / 100,
      description: description.trim() || undefined,
      store: store.trim() || undefined,
      date,
      photos,
    };
    if (editingId) {
      const before = expenses.find((e) => e.id === editingId);
      removePhotos((before?.photos ?? []).filter((p) => !photos.includes(p)));
      updateExpense(editingId, data);
    } else {
      addExpense({ ...data, projectId: project.id });
    }
    setMode('view');
  };

  const cancelExpense = () => {
    // Photos taken for an entry that was never saved are not needed.
    const kept = editingId ? (expenses.find((e) => e.id === editingId)?.photos ?? []) : [];
    removePhotos(photos.filter((p) => !kept.includes(p)));
    setMode('view');
  };

  const deleteExpense = (e: Expense) =>
    Alert.alert('Delete this expense?', `${e.category}  ${money(e.amount)}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removePhotos(e.photos);
          removeExpense(e.id);
          setMode('view');
        },
      },
    ]);

  const startEdit = () => {
    setName(project.name);
    setBudget(project.budget != null ? String(project.budget) : '');
    setNote(project.note ?? '');
    setMode('edit');
  };

  const saveEdit = () => {
    updateProject(project.id, { name: name.trim() || project.name, budget: toNumber(budget), note: note.trim() || undefined });
    setMode('view');
  };

  const confirmRemove = () =>
    Alert.alert(`Delete ${project.name}?`, 'Its expenses, receipts and photos are deleted too.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          router.back();
          removePhotos([...project.photos, ...expenses.flatMap((e) => e.photos)]);
          removeProject(project.id);
        },
      },
    ]);

  const setProjectPhotos = (next: string[]) => {
    removePhotos(project.photos.filter((p) => !next.includes(p)));
    updateProject(project.id, { photos: next });
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: home.name }} />

      <Banner
        colors={gradients.diy}
        icon={room.icon}
        photo={project.photos[0]}
        title={project.name}
        subtitle={`${roomLabel}${project.done ? '  ·  Finished' : ''}`}
        height={190}
      >
        <View style={local.stats}>
          <BannerStat value={money(totals.total, false)} label="Spent" />
          {left != null ? (
            <BannerStat value={money(left, false)} label={left < 0 ? 'Over budget' : 'Left in budget'} />
          ) : (
            <BannerStat value={totals.count} label={totals.count === 1 ? 'Receipt' : 'Receipts'} />
          )}
        </View>
      </Banner>

      {mode === 'view' ? <Button label="Add an expense" icon="add" onPress={() => openExpense()} /> : null}

      {mode === 'expense' ? (
        <Card style={local.gap}>
          <Text style={[ui.label, { color: t.sub }]}>{editingId ? 'EDIT EXPENSE' : 'WHAT WAS IT FOR?'}</Text>
          <View style={ui.row}>
            {categories.map((c) => (
              <Button key={c} small kind={category === c ? 'primary' : 'plain'} label={c} onPress={() => setCategory(c)} />
            ))}
            <Button small kind={category === OTHER ? 'primary' : 'plain'} label="Other" onPress={() => setCategory(OTHER)} />
          </View>
          {category === OTHER ? (
            <Field label="Name this category" value={customCategory} onChangeText={setCustomCategory} placeholder="Towel bars, permits, dumpster" autoCapitalize="sentences" />
          ) : null}
          <Field label="Amount" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" />
          <Field label="What you bought (optional)" value={description} onChangeText={setDescription} placeholder="Vinyl plank, 6 boxes" />
          <Field label="Store (optional)" value={store} onChangeText={setStore} placeholder="Where you bought it" autoCapitalize="words" />
          <DateStepper label="Date" value={date} onChange={setDate} />
          <PhotoStrip label="Receipt photos" photos={photos} onChange={setPhotos} />
          <Button label={editingId ? 'Save changes' : 'Save expense'} disabled={!canSaveExpense} onPress={saveExpense} />
          <Button kind="plain" label="Cancel" onPress={cancelExpense} />
          {editingId ? (
            <Button
              kind="danger"
              label="Delete expense"
              onPress={() => {
                const e = expenses.find((x) => x.id === editingId);
                if (e) deleteExpense(e);
              }}
            />
          ) : null}
        </Card>
      ) : null}

      {mode === 'edit' ? (
        <Card style={local.gap}>
          <Field label="Project name" value={name} onChangeText={setName} autoCapitalize="sentences" />
          <Field label="Budget" value={budget} onChangeText={setBudget} placeholder="No budget" keyboardType="decimal-pad" />
          <Field label="Note" value={note} onChangeText={setNote} placeholder="Paint colors, measurements, contractor contacts" />
          <Button label="Save" onPress={saveEdit} />
          <Button kind="plain" label="Cancel" onPress={() => setMode('view')} />
          <Button kind="danger" label="Delete project" onPress={confirmRemove} />
        </Card>
      ) : null}

      {mode !== 'edit' && project.note ? (
        <Card>
          <Text style={[ui.sub, { color: t.text }]}>{project.note}</Text>
        </Card>
      ) : null}

      <SectionTitle>Where the money went</SectionTitle>
      {totals.byCategory.length === 0 ? (
        <Text style={[ui.sub, { color: t.sub }]}>
          Nothing logged yet. Add an expense for {categories.slice(0, 3).join(', ').toLowerCase()} or anything else on this project.
        </Text>
      ) : (
        <Card style={local.gap}>
          {totals.byCategory.map((c) => (
            <View key={c.category}>
              <View style={local.between}>
                <Text style={[local.catName, { color: t.text }]}>{c.category}</Text>
                <Text style={[local.catTotal, { color: t.text }]}>{money(c.total)}</Text>
              </View>
              <View style={[local.track, { backgroundColor: t.muted }]}>
                <View style={[local.fill, { width: `${Math.max(4, (c.total / totals.total) * 100)}%` }]} />
              </View>
            </View>
          ))}
          <View style={[local.between, local.totalRow, { borderTopColor: t.line }]}>
            <Text style={[local.catName, { color: t.text }]}>Total</Text>
            <Text style={[local.catTotal, { color: t.text }]}>{money(totals.total)}</Text>
          </View>
        </Card>
      )}

      <SectionTitle>Expenses ({expenses.length})</SectionTitle>
      {expenses.map((e) => (
        <Card key={e.id} style={local.expense}>
          <Pressable
            style={local.expenseMain}
            accessibilityRole="button"
            accessibilityLabel={`${e.category}. ${money(e.amount)}. Tap to edit`}
            onPress={() => openExpense(undefined, e)}
          >
            <View style={local.between}>
              <Text style={[ui.title, { color: t.text }]} numberOfLines={1}>
                {e.description || e.category}
              </Text>
              <Text style={[ui.title, { color: t.text }]}>{money(e.amount)}</Text>
            </View>
            <Text style={[ui.sub, { color: t.sub }]}>
              {[e.description ? e.category : null, formatDate(e.date), e.store].filter(Boolean).join('  ·  ')}
            </Text>
          </Pressable>
          <PhotoStrip photos={e.photos} size={64} />
        </Card>
      ))}

      <SectionTitle>Project photos ({project.photos.length})</SectionTitle>
      <PhotoStrip label="Before, during and after" photos={project.photos} onChange={setProjectPhotos} size={96} />

      {mode === 'view' ? (
        <>
          <Button
            kind="plain"
            icon={project.done ? 'refresh' : 'checkmark-done'}
            label={project.done ? 'Reopen project' : 'Mark project finished'}
            onPress={() => updateProject(project.id, { done: !project.done })}
          />
          <Button kind="plain" icon="create-outline" label="Edit project" onPress={startEdit} />
        </>
      ) : null}
    </Screen>
  );
}

const local = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 8, marginTop: 10 },
  gap: { gap: 12 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  catName: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
  catTotal: { fontSize: 15, fontWeight: '700' },
  track: { height: 8, borderRadius: 4, marginTop: 6, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: '#E07B1F' },
  totalRow: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12 },
  expense: { gap: 8 },
  expenseMain: { gap: 4 },
});
