import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildBackup, describeBackup, parseBackup, photoNames } from '../src/lib/backup.ts';
import { dialable, tradeFor } from '../src/lib/contacts.ts';
import { normalizeRecalls } from '../src/lib/recalls.ts';
import { buildReportHtml, esc, spendingByYear } from '../src/lib/report.ts';
import { allSeasonItems, itemsFor, seasonForMonth, seasonKey } from '../src/lib/seasons.ts';

const data = () => ({
  assets: [
    { id: 'h', kind: 'home', name: 'Our <house>', createdAt: '2026-01-01', photo: 'a.jpg', rental: true, facts: [{ label: 'Main water shutoff', value: 'Front yard' }] },
    { id: 'c', kind: 'vehicle', name: 'Jeep', createdAt: '2026-01-01', year: 1999, make: 'Jeep', model: 'Wrangler', mileage: 120000 },
  ],
  tasks: [
    { id: 't1', assetId: 'h', applianceId: 'ap', title: 'Replace cooler pads', everyMonths: 12, startAt: '2026-01-01' },
    { id: 't2', assetId: 'c', title: 'Oil and filter change', everyMonths: 6, everyMiles: 5000, startAt: '2026-01-01' },
  ],
  logs: [
    { id: 'l1', taskId: 't1', assetId: 'h', doneAt: '2026-04-02', cost: 39.99, note: 'Aspen pads', photos: ['b.jpg', 'a.jpg'] },
    { id: 'l2', taskId: 't2', assetId: 'c', doneAt: '2026-05-01', miles: 121000, cost: 64.5, specs: [{ label: 'Oil weight', value: '10W-30' }] },
    { id: 'l3', taskId: 't1', assetId: 'h', doneAt: '2025-04-10', cost: 35 },
  ],
  warranties: [{ id: 'w', name: 'Dishwasher', purchasedAt: '2025-11-09', months: 24, photos: ['c.jpg'], retailer: 'Lowe\'s' }],
  appliances: [{ id: 'ap', assetId: 'h', category: 'cooling', option: 'swamp', name: 'Swamp cooler', brand: 'MasterCool', photos: [] }],
  projects: [{ id: 'p', assetId: 'h', name: 'Bathroom remodel', room: 'bathroom', startedAt: '2026-03-01', photos: ['d.jpg'] }],
  expenses: [
    { id: 'e1', projectId: 'p', category: 'Floors', amount: 412.38, date: '2026-03-05', photos: ['e.jpg'] },
    { id: 'e2', projectId: 'p', category: 'Paint', amount: 64.97, date: '2026-03-06', photos: [] },
  ],
  contacts: [{ id: 'k', name: 'Desert Air', trade: 'HVAC', phone: '(505) 555-0100' }],
  seasonChecks: { '2026-fall': ['fa-gutters'] },
  settings: { remindersOn: false, leadDays: 14 },
});

test('a backup round trips with every list and its photos', () => {
  const d = data();
  const text = buildBackup({ ...d, hydrated: true, addAsset() {} }, { 'a.jpg': 'QUJD' }, '2026-11-10T16:00:00.000Z');
  assert.ok(!text.includes('hydrated'), 'only saved data goes in the file');
  const back = parseBackup(text);
  assert.deepEqual(back.data, d);
  assert.deepEqual(back.photos, { 'a.jpg': 'QUJD' });
  assert.equal(back.exportedAt, '2026-11-10T16:00:00.000Z');
  assert.equal(describeBackup(back.data), '2 homes and vehicles, 2 tasks, 3 log entries, 1 warranty, 1 project');
});

test('photo names are collected once from everywhere they are used', () => {
  assert.deepEqual(photoNames(data()).sort(), ['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg', 'e.jpg']);
});

test('bad backup files are refused with a clear message', () => {
  assert.throws(() => parseBackup('not json'), /not an Upkeep backup/);
  assert.throws(() => parseBackup('{"app":"other","data":{}}'), /not an Upkeep backup/);
  assert.throws(() => parseBackup('[]'), /not an Upkeep backup/);
  assert.throws(() => parseBackup(JSON.stringify({ app: 'upkeep', version: 99, data: {} })), /newer version/);
  assert.throws(() => parseBackup(JSON.stringify({ app: 'upkeep', version: 1, data: { assets: 'nope' } })), /damaged/);
});

test('an older or partial backup fills in what is missing and drops unsafe photo names', () => {
  const back = parseBackup(
    JSON.stringify({ app: 'upkeep', version: 1, data: { assets: [{ id: 'h', kind: 'home', name: 'x', createdAt: '2026-01-01' }, null, { name: 'no id' }] }, photos: { 'ok.jpg': 'QQ==', '../evil.jpg': 'QQ==', 'sub/x.jpg': 'QQ==' } })
  );
  assert.equal(back.data.assets.length, 1);
  assert.deepEqual(back.data.contacts, []);
  assert.deepEqual(back.data.seasonChecks, {});
  assert.deepEqual(back.data.settings, { remindersOn: true, leadDays: 7 });
  assert.deepEqual(Object.keys(back.photos), ['ok.jpg']);
});

test('the report includes the right records and escapes what the owner typed', () => {
  const d = data();
  const html = buildReportHtml({ ...d, asset: d.assets[0], today: '2026-11-10' });
  assert.ok(html.includes('Our &lt;house&gt;'));
  assert.ok(!html.includes('<house>'));
  assert.ok(html.includes('Rental property'));
  assert.ok(html.includes('Main water shutoff'));
  assert.ok(html.includes('MasterCool'));
  assert.ok(html.includes('Replace cooler pads'));
  assert.ok(html.includes('Aspen pads'));
  assert.ok(html.includes('Bathroom remodel'));
  assert.ok(html.includes('$477.35'));
  assert.ok(html.includes('Lowe&#39;s'));
  assert.ok(html.includes('Service history (2)'));
  assert.ok(!html.includes('Oil and filter change'), 'another asset\'s work stays out');

  const car = buildReportHtml({ ...d, asset: d.assets[1], today: '2026-11-10' });
  assert.ok(car.includes('1999 Jeep Wrangler'));
  assert.ok(car.includes('120,000 miles'));
  assert.ok(car.includes('Oil weight: 10W-30'));
  assert.ok(car.includes('121,000 mi'));
  assert.ok(!car.includes('Warranties on file'));
  assert.ok(!car.includes('Bathroom remodel'));
  assert.equal(esc(`<a href="x">&'</a>`), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
});

test('spending is grouped by year without float drift', () => {
  const d = data();
  const home = spendingByYear(d.logs.filter((l) => l.assetId === 'h'), d.expenses);
  assert.deepEqual(home, [
    { year: '2026', maintenance: 39.99, diy: 477.35, total: 517.34 },
    { year: '2025', maintenance: 35, diy: 0, total: 35 },
  ]);
  assert.deepEqual(spendingByYear([{ doneAt: '2026-01-01', cost: 0.1 }, { doneAt: '2026-02-01', cost: 0.2 }], []), [
    { year: '2026', maintenance: 0.3, diy: 0, total: 0.3 },
  ]);
});

test('seasons follow the calendar and December counts toward next winter', () => {
  assert.equal(seasonForMonth(3), 'spring');
  assert.equal(seasonForMonth(8), 'summer');
  assert.equal(seasonForMonth(11), 'fall');
  assert.equal(seasonForMonth(12), 'winter');
  assert.equal(seasonForMonth(2), 'winter');
  assert.equal(seasonKey('2026-11-10'), '2026-fall');
  assert.equal(seasonKey('2026-12-15'), '2027-winter');
  assert.equal(seasonKey('2027-01-15'), '2027-winter');
});

test('seasonal items fit what the user has', () => {
  const none = { hasVehicle: false, appliances: new Set() };
  const swamp = { hasVehicle: true, appliances: new Set(['cooling:swamp']) };
  const ids = (s, c) => itemsFor(s, c).map((i) => i.id);
  assert.ok(!ids('fall', none).includes('fa-swamp'));
  assert.ok(!ids('fall', none).includes('fa-battery'));
  assert.ok(ids('fall', swamp).includes('fa-swamp'));
  assert.ok(ids('fall', swamp).includes('fa-battery'));
  assert.ok(!ids('summer', swamp).includes('su-condenser'));
  assert.ok(ids('summer', { hasVehicle: false, appliances: new Set(['cooling:refrigerated']) }).includes('su-condenser'));
  for (const s of ['spring', 'summer', 'fall', 'winter']) assert.ok(ids(s, none).length >= 5, s);
  const all = allSeasonItems().map((i) => i.id);
  assert.equal(new Set(all).size, all.length, 'ids are unique');
});

test('jobs map to the right kind of pro', () => {
  assert.equal(tradeFor('Change brake fluid'), 'Mechanic');
  assert.equal(tradeFor('Oil and filter change'), 'Mechanic');
  assert.equal(tradeFor('Schedule gas furnace inspection'), 'HVAC');
  assert.equal(tradeFor('Schedule AC tune-up'), 'HVAC');
  assert.equal(tradeFor('Replace cooler pads'), 'HVAC');
  assert.equal(tradeFor('Check water heater burner and vent'), 'Plumber');
  assert.equal(tradeFor('Inspect roof'), 'Roofer');
  assert.equal(tradeFor('Check range gas line connector'), 'Appliance repair');
  // "coils" must not send a fridge job to a mechanic.
  assert.equal(tradeFor('Clean refrigerator coils'), 'Appliance repair');
  assert.equal(tradeFor('Test smoke and CO alarms'), undefined);
  assert.equal(dialable('(505) 555-0100'), '5055550100');
  assert.equal(dialable('+1 505.555.0100'), '+15055550100');
});

test('recall results are read whatever the key capitalization', () => {
  const upper = normalizeRecalls({
    Count: 1,
    results: [{ NHTSACampaignNumber: '12V345000', Component: 'AIR BAGS', Summary: ' Inflator may rupture. ', Consequence: 'Injury', Remedy: 'Dealer replaces it.', ReportReceivedDate: '01/02/2012' }],
  });
  assert.deepEqual(upper, [
    { campaign: '12V345000', component: 'AIR BAGS', summary: 'Inflator may rupture.', consequence: 'Injury', remedy: 'Dealer replaces it.', reported: '01/02/2012' },
  ]);
  const lower = normalizeRecalls({ Results: [{ nhtsaCampaignNumber: 'X', component: 'BRAKES', summary: 's' }, null, {}] });
  assert.equal(lower.length, 1);
  assert.equal(lower[0].component, 'BRAKES');
  assert.deepEqual(normalizeRecalls({ Count: 0, results: [] }), []);
  assert.deepEqual(normalizeRecalls(null), []);
  assert.deepEqual(normalizeRecalls('oops'), []);
});
