import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseBackup } from '../src/lib/backup.ts';
import { buyAgainQuery, matchesPurchase, purchaseCategory, purchaseSummary, PURCHASE_CATEGORIES } from '../src/lib/purchases.ts';
import { buildTransfer, describeTransfer, parseTransfer, prepareImport, selectTransfer } from '../src/lib/transfer.ts';

const paint = {
  id: 'pu1', assetId: 'h', category: 'paint', name: 'Living room walls', brand: 'Sherwin-Williams', store: 'Home Depot', price: 54.98,
  specs: [{ label: 'Color name', value: 'Agreeable Gray' }, { label: 'Color code', value: 'SW 7029' }, { label: 'Sheen', value: 'Eggshell' }],
  photos: ['p1.jpg'],
};
const bulb = { id: 'pu2', assetId: 'h', category: 'bulbs', name: 'Kitchen can lights', brand: 'Philips', specs: [{ label: 'Base type', value: 'E26' }, { label: 'Color temperature', value: '2700K' }], photos: [] };

test('products: summary, search and buy again', () => {
  assert.equal(purchaseSummary(paint), 'Agreeable Gray  ·  SW 7029  ·  Eggshell');
  assert.equal(buyAgainQuery(paint), 'Sherwin-Williams Agreeable Gray SW 7029 Home Depot');
  assert.equal(buyAgainQuery(bulb), 'Philips Kitchen can lights lightbulbs');
  assert.equal(buyAgainQuery({ ...bulb, specs: [{ label: 'Size', value: 'A19' }] }), 'Philips A19');
  assert.ok(matchesPurchase(paint, 'agreeable eggshell'));
  assert.ok(matchesPurchase(bulb, 'e26'));
  assert.ok(matchesPurchase(bulb, 'lightbulbs'));
  assert.ok(!matchesPurchase(bulb, 'gray'));
  assert.ok(matchesPurchase(bulb, '   '));
  assert.equal(purchaseCategory('nope').label, 'Other');
  const keys = [...PURCHASE_CATEGORIES.home, ...PURCHASE_CATEGORIES.vehicle].map((c) => c.key);
  assert.equal(new Set(keys).size, keys.length, 'category keys are unique across homes and vehicles');
});

const world = () => ({
  assets: [
    { id: 'h', kind: 'home', name: 'Elm St', createdAt: '2026-01-01', rental: true, photo: 'house.jpg',
      facts: [{ label: 'Main water shutoff', value: 'Front yard' }, { label: 'Tenant', value: 'J. Doe' }, { label: 'Tenant phone', value: '555' }] },
    { id: 'c', kind: 'vehicle', name: 'Jeep', createdAt: '2026-01-01' },
  ],
  tasks: [
    { id: 't1', assetId: 'h', applianceId: 'ap', title: 'Replace cooler pads', everyMonths: 12, startAt: '2026-01-01' },
    { id: 't2', assetId: 'c', title: 'Oil and filter change', everyMonths: 6, startAt: '2026-01-01' },
  ],
  logs: [
    { id: 'l1', taskId: 't1', assetId: 'h', doneAt: '2026-04-02', cost: 39.99, contactId: 'k1', photos: ['r1.jpg'] },
    { id: 'l2', taskId: 't2', assetId: 'c', doneAt: '2026-05-01', cost: 64.5, contactId: 'k2' },
  ],
  appliances: [{ id: 'ap', assetId: 'h', category: 'cooling', option: 'swamp', name: 'Swamp cooler', photos: [] }],
  projects: [{ id: 'p', assetId: 'h', name: 'Bathroom', room: 'bathroom', startedAt: '2026-03-01', photos: [] }],
  expenses: [{ id: 'e', projectId: 'p', category: 'Floors', amount: 412.38, date: '2026-03-05', photos: [] }],
  purchases: [paint, bulb, { ...bulb, id: 'pu3', assetId: 'c', category: 'tires', name: 'Tires' }],
  contacts: [
    { id: 'k1', name: 'Desert Air', trade: 'HVAC', phone: '(505) 555-0100', rating: 5 },
    { id: 'k2', name: "Sal's Garage", trade: 'Mechanic' },
    { id: 'k3', name: 'Never Used', trade: 'Roofer' },
    { id: 'k4', name: 'Rio Plumbing', trade: 'Plumber' },
  ],
  proJobs: [
    { id: 'j1', contactId: 'k4', assetId: 'h', title: 'New water heater', date: '2026-06-01', cost: 1400, photos: ['inv.jpg'] },
    { id: 'j2', contactId: 'k2', assetId: 'c', title: 'Brakes', date: '2026-06-01', cost: 300, photos: [] },
  ],
  warranties: [
    { id: 'w1', name: 'Water heater', purchasedAt: '2026-06-01', months: 72, price: 1400, photos: [] },
    { id: 'w2', name: 'Laptop', purchasedAt: '2026-06-01', months: 12, photos: [] },
  ],
});

test('a transfer holds only this home and the pros who worked on it, with private things left out', () => {
  const t = selectTransfer(world(), 'h', { includeCosts: false, warrantyIds: ['w1'] });
  assert.deepEqual(t.assets.map((a) => a.id), ['h']);
  assert.equal(t.assets[0].rental, undefined);
  assert.deepEqual(t.assets[0].facts, [{ label: 'Main water shutoff', value: 'Front yard' }], 'tenant details never go');
  assert.deepEqual(t.tasks.map((x) => x.id), ['t1']);
  assert.deepEqual(t.logs.map((x) => x.id), ['l1']);
  assert.equal(t.logs[0].cost, undefined, 'costs stripped');
  assert.deepEqual(t.purchases.map((x) => x.id), ['pu1', 'pu2']);
  assert.equal(t.purchases[0].price, undefined);
  assert.deepEqual(t.expenses, [], 'project spending stays private');
  assert.equal(t.projects.length, 1);
  assert.deepEqual(t.contacts.map((c) => c.id).sort(), ['k1', 'k4'], 'only pros who worked here');
  assert.deepEqual(t.proJobs.map((x) => x.id), ['j1']);
  assert.equal(t.proJobs[0].cost, undefined);
  assert.deepEqual(t.warranties.map((w) => w.id), ['w1']);
  assert.equal(t.warranties[0].price, undefined);
  assert.equal(world().logs[0].cost, 39.99, 'the original records are untouched');

  const withCosts = selectTransfer(world(), 'h', { includeCosts: true, warrantyIds: [] });
  assert.equal(withCosts.logs[0].cost, 39.99);
  assert.equal(withCosts.expenses.length, 1);
  assert.equal(withCosts.purchases[0].price, 54.98);
  assert.deepEqual(withCosts.warranties, []);
  assert.equal(describeTransfer(t), '1 task, 1 service record, 1 appliance, 2 products, 1 project, 2 pros, 1 warranty');
  assert.throws(() => selectTransfer(world(), 'missing', { includeCosts: false, warrantyIds: [] }), /not found/);
});

test('transfer files round trip and are kept apart from backups', () => {
  const t = selectTransfer(world(), 'h', { includeCosts: false, warrantyIds: [] });
  const text = buildTransfer(t, { 'house.jpg': 'QUJD', '../x.jpg': 'QQ==' }, '2026-11-26T19:00:00.000Z');
  const back = parseTransfer(text);
  assert.equal(back.from, 'Elm St');
  assert.deepEqual(back.data.tasks, t.tasks);
  assert.deepEqual(Object.keys(back.photos), ['house.jpg']);
  assert.throws(() => parseBackup(text), /transfer file/);
  assert.throws(() => parseTransfer(JSON.stringify({ app: 'upkeep', version: 1, data: {} })), /full backup/);
  assert.throws(() => parseTransfer('nope'), /not a transfer/);
  assert.throws(() => parseTransfer(JSON.stringify({ app: 'upkeep', kind: 'transfer', version: 9, data: {} })), /newer version/);
  assert.throws(() => parseTransfer(JSON.stringify({ app: 'upkeep', kind: 'transfer', version: 1, data: { assets: [] } })), /damaged/);
});

test('importing gives every record a new id, keeps every link and matches pros the buyer already has', () => {
  const t = selectTransfer(world(), 'h', { includeCosts: true, warrantyIds: ['w1'] });
  let n = 0;
  const mine = [{ id: 'mine1', name: 'Some Other HVAC', trade: 'HVAC', phone: '505.555.0100' }];
  const { data, prosMatched } = prepareImport(t, mine, () => `n${++n}`);
  assert.equal(prosMatched, 1, 'Desert Air matched by phone number');
  assert.deepEqual(data.contacts.map((c) => c.name), ['Rio Plumbing']);
  const all = [...data.assets, ...data.tasks, ...data.logs, ...data.appliances, ...data.projects, ...data.expenses, ...data.purchases, ...data.proJobs, ...data.warranties, ...data.contacts];
  const oldIds = new Set(['h', 't1', 'l1', 'ap', 'p', 'e', 'pu1', 'pu2', 'j1', 'w1', 'k1', 'k4']);
  for (const r of all) assert.ok(!oldIds.has(r.id), `new id for ${r.id}`);
  const home = data.assets[0];
  assert.equal(data.tasks[0].assetId, home.id);
  assert.equal(data.tasks[0].applianceId, data.appliances[0].id);
  assert.equal(data.appliances[0].assetId, home.id);
  assert.equal(data.logs[0].taskId, data.tasks[0].id);
  assert.equal(data.logs[0].contactId, 'mine1', 'log points at the buyer\'s own matching pro');
  assert.equal(data.expenses[0].projectId, data.projects[0].id);
  assert.ok(data.purchases.every((p) => p.assetId === home.id));
  assert.equal(data.proJobs[0].contactId, data.contacts[0].id);
  assert.equal(data.proJobs[0].assetId, home.id);
});
