import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addDays, addMonths, computeDue, describeInterval, diffDays, latestLog } from '../src/lib/due.ts';

const home = { id: 'h', kind: 'home', name: 'House', createdAt: '2026-01-01' };
const car = (mileage) => ({ id: 'c', kind: 'vehicle', name: 'Truck', mileage, createdAt: '2026-01-01' });
const log = (doneAt, miles) => ({ id: doneAt, taskId: 't', assetId: 'c', doneAt, miles });

test('addMonths clamps to the end of short months', () => {
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28');
  assert.equal(addMonths('2024-01-31', 1), '2024-02-29');
  assert.equal(addMonths('2026-11-15', 3), '2027-02-15');
  assert.equal(addMonths('2026-03-31', -1), '2026-02-28');
});

test('addDays and diffDays cross month, year and daylight saving boundaries', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(diffDays('2026-03-07', '2026-03-09'), 2);
  assert.equal(diffDays('2026-10-31', '2026-11-02'), 2);
  assert.equal(diffDays('2026-01-01', '2027-01-01'), 365);
});

test('a date task moves from ok to soon to overdue', () => {
  const task = { id: 't', assetId: 'h', title: 'Filter', everyMonths: 3, startAt: '2026-01-01' };
  const last = { id: 'l', taskId: 't', assetId: 'h', doneAt: '2026-01-10' };
  assert.equal(computeDue(task, last, home, '2026-02-01', 7).status, 'ok');
  assert.equal(computeDue(task, last, home, '2026-04-05', 7).status, 'soon');
  const d = computeDue(task, last, home, '2026-04-10', 7);
  assert.equal(d.status, 'soon');
  assert.equal(d.label, 'Due today');
  const o = computeDue(task, last, home, '2026-04-15', 7);
  assert.equal(o.status, 'overdue');
  assert.equal(o.label, 'Overdue by 5 days');
});

test('a task with no log is unlogged and counts from the day it was added', () => {
  const task = { id: 't', assetId: 'h', title: 'Gutters', everyMonths: 6, startAt: '2026-01-01' };
  const d = computeDue(task, undefined, home, '2026-01-02', 7);
  assert.equal(d.status, 'unlogged');
  assert.equal(d.dueDate, '2026-07-01');
  assert.equal(computeDue(task, undefined, home, '2026-07-05', 7).status, 'overdue');
});

test('mileage wins when it comes first', () => {
  const task = { id: 't', assetId: 'c', title: 'Oil', everyMonths: 6, everyMiles: 5000, startAt: '2026-01-01', startMiles: 80000 };
  const d = computeDue(task, log('2026-01-01', 80000), car(84700), '2026-02-01', 7);
  assert.equal(d.status, 'soon');
  assert.equal(d.milesLeft, 300);
  assert.equal(d.label, 'Due in 300 mi');
  const o = computeDue(task, log('2026-01-01', 80000), car(85250), '2026-02-01', 7);
  assert.equal(o.status, 'overdue');
  assert.equal(o.label, 'Overdue by 250 mi');
});

test('date wins when the vehicle is barely driven', () => {
  const task = { id: 't', assetId: 'c', title: 'Oil', everyMonths: 6, everyMiles: 5000, startAt: '2026-01-01', startMiles: 80000 };
  const d = computeDue(task, log('2026-01-01', 80000), car(80100), '2026-07-03', 7);
  assert.equal(d.status, 'overdue');
  assert.equal(d.label, 'Overdue by 2 days');
});

test('a mileage only task with no odometer reading asks for one', () => {
  const task = { id: 't', assetId: 'c', title: 'Belt', everyMiles: 60000, startAt: '2026-01-01' };
  const d = computeDue(task, undefined, car(undefined), '2026-02-01', 7);
  assert.equal(d.label, 'Add mileage to track this');
  assert.equal(d.status, 'unlogged');
});

test('overdue sorts ahead of soon, unlogged and ok', () => {
  const mk = (startAt) => ({ id: 't', assetId: 'h', title: 'x', everyMonths: 1, startAt });
  const done = (doneAt) => ({ id: 'l', taskId: 't', assetId: 'h', doneAt });
  const today = '2026-06-15';
  const over = computeDue(mk('2026-01-01'), done('2026-05-01'), home, today, 7).rank;
  const soon = computeDue(mk('2026-01-01'), done('2026-05-18'), home, today, 7).rank;
  const unlogged = computeDue(mk('2026-06-14'), undefined, home, today, 7).rank;
  const ok = computeDue(mk('2026-01-01'), done('2026-06-14'), home, today, 7).rank;
  assert.ok(over < soon && soon < unlogged && unlogged < ok);
});

test('latestLog picks the most recent entry for the task', () => {
  const logs = [log('2026-01-01', 1), log('2026-03-01', 3), { ...log('2026-09-01', 9), taskId: 'other' }, log('2026-02-01', 2)];
  assert.equal(latestLog(logs, 't').doneAt, '2026-03-01');
  assert.equal(latestLog(logs, 'none'), undefined);
});

test('describeInterval reads naturally', () => {
  assert.equal(describeInterval({ everyMonths: 1 }), 'Every month');
  assert.equal(describeInterval({ everyMonths: 12 }), 'Every year');
  assert.equal(describeInterval({ everyMonths: 24 }), 'Every 2 years');
  assert.equal(describeInterval({ everyMonths: 6, everyMiles: 5000 }), 'Every 6 months or every 5,000 mi');
});
