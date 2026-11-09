import { useState } from 'react';
import { Text, View } from 'react-native';

import { addMonths, describeMonths, formatDate, todayStr } from '../lib/due';
import { useTheme } from '../lib/theme';
import type { WarrantyItem } from '../lib/types';
import { PhotoStrip } from './PhotoStrip';
import { Button, DateStepper, Field, styles as ui, toNumber } from './ui';

export type WarrantyValues = Omit<WarrantyItem, 'id'>;

const LENGTHS = [3, 6, 12, 24, 36, 60, 120];

/** Shared by the new warranty and edit warranty screens. */
export function WarrantyForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: WarrantyValues;
  submitLabel: string;
  onSubmit: (v: WarrantyValues) => void;
}) {
  const t = useTheme();
  const [name, setName] = useState(initial?.name ?? '');
  const [purchasedAt, setPurchasedAt] = useState(initial?.purchasedAt ?? todayStr());
  const [months, setMonths] = useState(initial?.months ?? 12);
  const [custom, setCustom] = useState(initial && !LENGTHS.includes(initial.months) ? String(initial.months) : '');
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : '');
  const [retailer, setRetailer] = useState(initial?.retailer ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? []);

  const customMonths = toNumber(custom);
  const length = custom.trim() ? Math.round(customMonths ?? 0) : months;
  const valid = name.trim().length > 0 && length > 0;

  return (
    <>
      <Field label="Item" value={name} onChangeText={setName} placeholder="Dishwasher, water heater, roof" autoCapitalize="words" />
      <DateStepper label="Purchase or install date" value={purchasedAt} onChange={setPurchasedAt} />

      <View style={ui.field}>
        <Text style={[ui.label, { color: t.sub }]}>Warranty length</Text>
        <View style={ui.row}>
          {LENGTHS.map((m) => (
            <Button
              key={m}
              small
              kind={!custom.trim() && months === m ? 'primary' : 'plain'}
              label={describeMonths(m)}
              onPress={() => {
                setMonths(m);
                setCustom('');
              }}
            />
          ))}
        </View>
      </View>
      <Field label="Or a custom length (months)" value={custom} onChangeText={setCustom} placeholder="18" keyboardType="number-pad" />
      {length > 0 ? (
        <Text style={[ui.sub, { color: t.sub }]}>Covered until {formatDate(addMonths(purchasedAt, length))}</Text>
      ) : null}

      <Field label="Price (optional)" value={price} onChangeText={setPrice} placeholder="0.00" keyboardType="decimal-pad" />
      <Field label="Bought from (optional)" value={retailer} onChangeText={setRetailer} placeholder="Store or installer" autoCapitalize="words" />
      <Field label="Note (optional)" value={note} onChangeText={setNote} placeholder="Model, serial number, claim phone number" />
      <PhotoStrip label="Photos of the receipt, serial plate or item" photos={photos} onChange={setPhotos} />

      <Button
        label={submitLabel}
        disabled={!valid}
        onPress={() =>
          onSubmit({
            name: name.trim(),
            purchasedAt,
            months: length,
            price: toNumber(price),
            retailer: retailer.trim() || undefined,
            note: note.trim() || undefined,
            photos,
          })
        }
      />
    </>
  );
}
