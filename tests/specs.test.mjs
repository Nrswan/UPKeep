import assert from 'node:assert/strict';
import { test } from 'node:test';

import { cleanSpecs, specRows, suggestedSpecLabels } from '../src/lib/specs.ts';

test('an oil change suggests oil weight and filter', () => {
  assert.deepEqual(suggestedSpecLabels('Oil and filter change'), ['Oil weight', 'Oil type', 'Oil capacity', 'Oil filter']);
});

test('specific filter tasks win over the general filter rule', () => {
  assert.deepEqual(suggestedSpecLabels('Replace engine air filter'), ['Filter part number']);
  assert.deepEqual(suggestedSpecLabels('Replace refrigerator water filter'), ['Filter part number']);
  assert.deepEqual(suggestedSpecLabels('Replace furnace filter'), ['Filter size', 'Filter rating']);
  assert.deepEqual(suggestedSpecLabels('Replace cooler pads'), ['Pad size', 'Number of pads']);
  assert.deepEqual(suggestedSpecLabels('Clean gutters'), []);
  assert.deepEqual(suggestedSpecLabels('Clean refrigerator coils'), []);
});

test('rows show suggestions filled from saved values, then custom fields', () => {
  const rows = specRows('Oil and filter change', [
    { label: 'Oil filter', value: 'Mopar MO-090' },
    { label: 'Drain plug gasket', value: '14mm' },
    { label: 'oil weight', value: '10W-30' },
  ]);
  assert.deepEqual(rows, [
    { label: 'Oil weight', value: '10W-30' },
    { label: 'Oil type', value: '' },
    { label: 'Oil capacity', value: '' },
    { label: 'Oil filter', value: 'Mopar MO-090' },
    { label: 'Drain plug gasket', value: '14mm' },
  ]);
});

test('cleanSpecs drops blanks and trims', () => {
  assert.deepEqual(
    cleanSpecs([
      { label: ' Oil weight ', value: ' 5W-30 ' },
      { label: 'Oil type', value: '  ' },
      { label: '', value: 'orphan' },
    ]),
    [{ label: 'Oil weight', value: '5W-30' }]
  );
});
