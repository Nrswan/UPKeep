import assert from 'node:assert/strict';
import { test } from 'node:test';

import { categoriesFor, findRoom, money, projectTotals } from '../src/lib/diy.ts';
import { whyItMatters } from '../src/lib/why.ts';

test('totals add up by category, largest first, without float drift', () => {
  const t = projectTotals([
    { category: 'Floors', amount: 19.99 },
    { category: 'Paint', amount: 42.5 },
    { category: 'Floors', amount: 19.99 },
    { category: 'Floors', amount: 19.99 },
  ]);
  assert.equal(t.total, 102.47);
  assert.equal(t.count, 4);
  assert.deepEqual(t.byCategory, [
    { category: 'Floors', total: 59.97, count: 3 },
    { category: 'Paint', total: 42.5, count: 1 },
  ]);
});

test('an empty project totals zero', () => {
  assert.deepEqual(projectTotals([]), { total: 0, count: 0, byCategory: [] });
});

test('bathroom offers the expected categories with Misc last', () => {
  const c = categoriesFor('bathroom');
  for (const want of ['Floors', 'Paint', 'Lighting', 'Mirrors', 'Vanity', 'Shower tile']) assert.ok(c.includes(want), want);
  assert.equal(c.at(-1), 'Misc');
});

test('custom categories already used on a project are offered again, once', () => {
  const c = categoriesFor('bathroom', ['Towel bars', 'Floors', 'Towel bars', 'misc']);
  assert.equal(c.filter((x) => x === 'Towel bars').length, 1);
  assert.equal(c.filter((x) => x.toLowerCase() === 'misc').length, 1);
  assert.ok(c.indexOf('Towel bars') < c.indexOf('Misc'));
});

test('an unknown room falls back to a general list', () => {
  assert.equal(findRoom('sunroom').key, 'other');
  assert.ok(categoriesFor('sunroom').includes('Materials'));
});

test('money formats with and without cents', () => {
  assert.equal(money(1234.5), '$1,234.50');
  assert.equal(money(1234.5, false), '$1,235');
  assert.equal(money(-80, false), '-$80');
});

test('every starter and appliance task has a reason, and the right one', async () => {
  const { PRESETS } = await import('../src/lib/presets.ts');
  const { APPLIANCES } = await import('../src/lib/appliances.ts');
  const titles = [
    ...PRESETS.home.map((p) => p.title),
    ...PRESETS.vehicle.map((p) => p.title),
    ...APPLIANCES.flatMap((c) => c.options.flatMap((o) => o.tasks.map((x) => x.title))),
  ];
  const missing = titles.filter((x) => !whyItMatters(x));
  assert.deepEqual(missing, []);
  assert.match(whyItMatters('Change brake fluid'), /moisture/);
  assert.match(whyItMatters('Inspect brakes'), /pads/);
  assert.match(whyItMatters('Check range gas line connector'), /gas utility/);
  assert.match(whyItMatters('Check dryer gas line connector'), /gas utility/);
  assert.match(whyItMatters('Schedule gas furnace inspection'), /venting/);
  assert.match(whyItMatters('Replace refrigerator water filter'), /filter/);
  assert.match(whyItMatters('Replace furnace filter'), /airflow/);
  assert.match(whyItMatters('Flush water heater'), /Sediment/);
  assert.match(whyItMatters('Winterize swamp cooler: drain, shut off water and cover'), /freeze/);
  assert.match(whyItMatters('Start up swamp cooler: clean pan, check pump, belt and float'), /pump/);
  assert.match(whyItMatters('Replace smoke alarm batteries'), /batteries/);
  assert.match(whyItMatters('Test smoke and CO alarms'), /test button/);
  // "coils" contains "oil" and must not be treated as an oil change.
  assert.match(whyItMatters('Clean refrigerator coils'), /compressor/);
  assert.match(whyItMatters('Clean outdoor condenser coils'), /shed heat/);
  assert.match(whyItMatters('Oil and filter change'), /lubricated/);
  assert.equal(whyItMatters('Wax the truck'), undefined);
});

test('every starter and appliance task has an effort guide', async () => {
  const { PRESETS } = await import('../src/lib/presets.ts');
  const { APPLIANCES } = await import('../src/lib/appliances.ts');
  const { effortFor, effortLabel } = await import('../src/lib/effort.ts');
  const titles = [
    ...PRESETS.home.map((p) => p.title),
    ...PRESETS.vehicle.map((p) => p.title),
    ...APPLIANCES.flatMap((c) => c.options.flatMap((o) => o.tasks.map((x) => x.title))),
  ];
  assert.deepEqual(titles.filter((x) => !effortFor(x)), []);
  // Jobs involving gas burners, brakes and sealed fluid systems point to a pro.
  for (const t of ['Change brake fluid', 'Inspect brakes', 'Flush coolant', 'Schedule gas furnace inspection', 'Check water heater burner and vent', 'Schedule AC tune-up']) {
    assert.equal(effortFor(t).level, 'pro', t);
  }
  // "coils" must not be read as an oil change.
  assert.equal(effortFor('Clean refrigerator coils').minutes, 20);
  assert.equal(effortFor('Check range gas line connector').level, 'easy');
  assert.equal(effortFor('Flush water heater').level, 'moderate');
  assert.equal(effortFor('Check water heater anode rod').minutes, 60);
  assert.equal(effortLabel({ level: 'easy', minutes: 5 }), 'Easy to do yourself  ·  about 5 min');
  assert.equal(effortLabel({ level: 'moderate', minutes: 60 }), 'Doable with some care  ·  about 1 hour');
  assert.equal(effortLabel({ level: 'pro' }), 'Best left to a pro');
  assert.equal(effortFor('Wax the truck'), undefined);
});
