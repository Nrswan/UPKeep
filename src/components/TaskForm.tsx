import { useState } from 'react';
import { Text } from 'react-native';

import { useTheme } from '../lib/theme';
import type { AssetKind, Task } from '../lib/types';
import { Button, Field, styles as ui, toNumber } from './ui';

export type TaskFormValues = Pick<Task, 'title' | 'note' | 'everyMonths' | 'everyMiles'>;

/** Shared by the new task and edit task screens. */
export function TaskForm({
  kind,
  initial,
  submitLabel,
  onSubmit,
}: {
  kind: AssetKind;
  initial?: Partial<TaskFormValues>;
  submitLabel: string;
  onSubmit: (v: TaskFormValues) => void;
}) {
  const t = useTheme();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [months, setMonths] = useState(initial?.everyMonths ? String(initial.everyMonths) : '');
  const [miles, setMiles] = useState(initial?.everyMiles ? String(initial.everyMiles) : '');
  const [note, setNote] = useState(initial?.note ?? '');

  const everyMonths = toNumber(months);
  const everyMiles = kind === 'vehicle' ? toNumber(miles) : undefined;
  const hasSchedule = (everyMonths ?? 0) > 0 || (everyMiles ?? 0) > 0;
  const valid = title.trim().length > 0 && hasSchedule;

  return (
    <>
      <Field label="Task" value={title} onChangeText={setTitle} placeholder="Replace water filter" autoCapitalize="sentences" />
      <Field label="Repeat every (months)" value={months} onChangeText={setMonths} placeholder="6" keyboardType="number-pad" />
      {kind === 'vehicle' ? (
        <Field
          label="Or every (miles)"
          value={miles}
          onChangeText={setMiles}
          placeholder="5000"
          keyboardType="number-pad"
          hint="With both set, the task is due at whichever comes first."
        />
      ) : null}
      <Field label="Note (optional)" value={note} onChangeText={setNote} placeholder="Filter size, part number, who to call" />
      {!hasSchedule && title.trim() ? <Text style={[ui.sub, { color: t.warn }]}>Set how often this repeats.</Text> : null}
      <Button
        label={submitLabel}
        disabled={!valid}
        onPress={() =>
          onSubmit({
            title: title.trim(),
            note: note.trim() || undefined,
            everyMonths: everyMonths ? Math.round(everyMonths) : undefined,
            everyMiles: everyMiles ? Math.round(everyMiles) : undefined,
          })
        }
      />
    </>
  );
}
