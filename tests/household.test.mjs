import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildBackup, parseBackup, photoNames } from '../src/lib/backup.ts';
import { choreDue, nextColor, starsThisWeek, validPin, weekStart } from '../src/lib/chores.ts';
import {
  docCategories,
  fileLabel,
  insuranceFacts,
  isPdf,
  matchesDoc,
  policyTypesFor,
  recentClaims,
  renewalInfo,
  safeFileName,
  yearlyPremium,
} from '../src/lib/insurance.ts';
import { buildInsuranceHtml, insurancePhotoNames } from '../src/lib/insuranceReport.ts';
import { prepareImport, selectTransfer } from '../src/lib/transfer.ts';

const today = '2026-11-26'; // a Thursday

test('policies: renewal and yearly premium', () => {
  assert.equal(renewalInfo({}, today).status, 'none');
  assert.equal(renewalInfo({ renewsAt: '2026-11-20' }, today).status, 'past');
  assert.equal(renewalInfo({ renewsAt: today }, today).label, 'Renews today');
  assert.equal(renewalInfo({ renewsAt: '2026-12-10' }, today).label, 'Renews in 14 days');
  assert.equal(renewalInfo({ renewsAt: '2027-06-01' }, today).status, 'ok');
  assert.equal(yearlyPremium({ premium: 120.5, premiumEvery: 'month' }), 1446);
  assert.equal(yearlyPremium({ premium: 600, premiumEvery: 'half' }), 1200);
  assert.equal(yearlyPremium({ premium: 1800 }), 1800);
  assert.equal(yearlyPremium({}), undefined);
  assert.ok(!policyTypesFor('vehicle').some((p) => p.key === 'home'));
  assert.ok(!policyTypesFor('home').some((p) => p.key === 'auto'));
});

test('documents: categories, file names and search', () => {
  assert.ok(docCategories('home').some((c) => c.key === 'deed'));
  assert.ok(!docCategories('vehicle').some((c) => c.key === 'deed'));
  assert.ok(docCategories('vehicle').some((c) => c.key === 'title'));
  assert.equal(safeFileName('Closing Disclosure (final).PDF', 'abc'), 'abc__Closing-Disclosure-final.pdf');
  assert.equal(safeFileName('../../etc/passwd', 'x'), 'x__passwd.pdf');
  assert.match(safeFileName('scan.jpeg', 'q'), /^[\w.-]+$/);
  assert.equal(fileLabel('abc__Closing-Disclosure-final.pdf'), 'Closing Disclosure final');
  assert.equal(fileLabel('k3x9.pdf', 1), 'PDF 2');
  assert.equal(fileLabel('k3x9.jpg'), 'Photo 1');
  assert.equal(fileLabel('blob:http://x/123#abc__Deed.pdf'), 'Deed');
  assert.ok(isPdf('a.PDF') && isPdf('blob:x#y__z.pdf') && !isPdf('a.jpg'));
  const d = { id: 'd', category: 'permit', title: 'Water heater', photos: [] };
  assert.ok(matchesDoc(d, 'permit') && matchesDoc(d, 'heater') && !matchesDoc(d, 'roof'));
  assert.equal(insuranceFacts('home')[0].label, 'Address');
});

test('claims: only the last 5 years, newest first', () => {
  const claims = [
    { id: 'a', title: 'Old', date: '2019-05-01', status: 'paid', photos: [] },
    { id: 'b', title: 'Hail', date: '2024-06-02', status: 'paid', photos: [] },
    { id: 'c', title: 'Pipe', date: '2025-01-15', status: 'review', photos: [] },
  ];
  assert.deepEqual(recentClaims(claims, today).map((c) => c.id), ['c', 'b']);
});

test('chores: due dates, repeats and one time chores', () => {
  const weekly = { id: 'w', title: 'Trash', everyDays: 7, startAt: '2026-11-20' };
  assert.equal(choreDue(weekly, [], today).status, 'overdue');
  assert.equal(choreDue(weekly, [], today).label, '6 days late');
  const logs = [{ id: 'l', choreId: 'w', doneAt: '2026-11-19' }];
  assert.equal(choreDue(weekly, logs, today).status, 'today');
  assert.equal(choreDue(weekly, [{ id: 'l', choreId: 'w', doneAt: '2026-11-25' }], today).label, 'Due Dec 2, 2026');
  assert.equal(choreDue(weekly, [{ id: 'l', choreId: 'w', doneAt: today }], today).status, 'done');
  assert.equal(choreDue({ ...weekly, startAt: today }, [], today).status, 'today');
  const once = { id: 'o', title: 'Clean garage', startAt: '2026-12-01' };
  assert.equal(choreDue(once, [], today).status, 'upcoming');
  assert.equal(choreDue(once, [{ id: 'x', choreId: 'o', doneAt: '2026-11-25' }], today).status, 'done');
  // A daily chore done yesterday is due again today.
  const daily = { id: 'd', title: 'Dishes', everyDays: 1, startAt: '2026-11-01' };
  assert.equal(choreDue(daily, [{ id: 'y', choreId: 'd', doneAt: '2026-11-25' }], today).status, 'today');
});

test('chores: stars count from Monday, PIN and colors', () => {
  assert.equal(weekStart(today), '2026-11-23');
  assert.equal(weekStart('2026-11-23'), '2026-11-23');
  assert.equal(weekStart('2026-11-29'), '2026-11-23');
  const stars = starsThisWeek(
    [
      { id: '1', choreId: 'a', memberId: 'kid', doneAt: '2026-11-23' },
      { id: '2', choreId: 'b', memberId: 'kid', doneAt: today },
      { id: '3', choreId: 'a', memberId: 'kid', doneAt: '2026-11-22' },
      { id: '4', choreId: 'a', memberId: 'mom', doneAt: '2026-11-24' },
      { id: '5', choreId: 'a', doneAt: '2026-11-24' },
    ],
    today
  );
  assert.equal(stars.get('kid'), 2);
  assert.equal(stars.get('mom'), 1);
  assert.ok(validPin('0420') && !validPin('42') && !validPin('abcd') && !validPin('12345'));
  assert.equal(nextColor([{ color: 'green' }, { color: 'blue' }]), 'purple');
});

const home = {
  id: 'h',
  kind: 'home',
  name: 'Main <house>',
  createdAt: '2020-01-01',
  photo: 'home.jpg',
  facts: [
    { label: 'Address', value: '1 Elm St' },
    { label: 'Roof replaced (year)', value: '2019' },
    { label: 'Main water shutoff', value: 'Front yard' },
    { label: 'Tenant', value: 'Pat' },
  ],
};
const all = {
  asset: home,
  policies: [
    { id: 'p', assetId: 'h', type: 'home', company: 'Acme Mutual', policyNumber: 'HO-1', deductible: 1000, premium: 150, premiumEvery: 'month', renewsAt: '2027-03-01', photos: ['dec.pdf'] },
    { id: 'p2', assetId: 'other', type: 'auto', company: 'Elsewhere', photos: [] },
  ],
  claims: [
    { id: 'c', policyId: 'p', title: 'Hail on roof', date: '2024-06-02', status: 'paid', paid: 8200, photos: ['hail.jpg', 'estimate.pdf'] },
    { id: 'c2', assetId: 'h', title: 'Ancient', date: '2010-01-01', status: 'paid', photos: [] },
  ],
  appliances: [{ id: 'ap', assetId: 'h', category: 'water', option: 'gas', name: 'Water heater', brand: 'Rheem', photos: ['plate.jpg'] }],
  warranties: [],
  projects: [{ id: 'pr', assetId: 'h', name: 'New kitchen', room: 'kitchen', startedAt: '2023-04-01', done: true, photos: [] }],
  expenses: [{ id: 'e', projectId: 'pr', category: 'Cabinets', amount: 4000, date: '2023-04-02', photos: [] }],
  proJobs: [{ id: 'j', contactId: 'k', assetId: 'h', title: 'Replaced roof', date: '2019-08-01', cost: 14000, photos: [] }],
  contacts: [{ id: 'k', name: 'Sky Roofing', trade: 'roofer' }],
  tasks: [{ id: 't', assetId: 'h', title: 'Test smoke alarms', startAt: '2020-01-01' }],
  logs: [
    { id: 'l1', taskId: 't', assetId: 'h', doneAt: '2026-10-01' },
    { id: 'l2', taskId: 't', assetId: 'h', doneAt: '2020-10-01' },
  ],
  docs: [{ id: 'd', assetId: 'h', category: 'inspection', title: 'Inspection report', photos: [] }],
  today,
};

test('insurance PDF: covers what agents ask and escapes text', () => {
  const html = buildInsuranceHtml(all);
  assert.ok(html.includes('Main &lt;house&gt;'));
  assert.ok(!html.includes('<house>'));
  assert.ok(html.includes('1 Elm St'));
  assert.ok(html.includes('Roof replaced (year)') && html.includes('2019'));
  // Only insurance facts. Tenant and shutoff locations stay out.
  assert.ok(!html.includes('Pat') && !html.includes('Front yard'));
  assert.ok(html.includes('Acme Mutual') && html.includes('$1,800.00') && !html.includes('Elsewhere'));
  assert.ok(html.includes('Hail on roof') && html.includes('$8,200.00') && !html.includes('Ancient'));
  assert.ok(html.includes('New kitchen') && html.includes('$4,000.00') && html.includes('Sky Roofing'));
  assert.ok(html.includes('Upkeep in the last 3 years (1)'));
  assert.ok(html.includes('Inspection report'));
  assert.ok(html.includes('Rheem'));

  const quiet = buildInsuranceHtml({ ...all, hideCosts: true });
  assert.ok(!quiet.includes('$'));

  const none = buildInsuranceHtml({ ...all, claims: [] });
  assert.ok(none.includes('None recorded.'));
});

test('insurance PDF: photos are pictures only and must be safe sources', () => {
  assert.deepEqual(insurancePhotoNames({ ...all, claims: [{ ...all.claims[0], assetId: 'h' }] }), ['home.jpg', 'hail.jpg', 'plate.jpg']);
  const html = buildInsuranceHtml({ ...all, photoSrc: { 'home.jpg': 'data:image/jpeg;base64,AAA', 'plate.jpg': 'javascript:alert(1)' } });
  assert.ok(html.includes('data:image/jpeg;base64,AAA'));
  assert.ok(!html.includes('javascript:'));
});

test('backups carry documents, insurance and chores', () => {
  const data = {
    assets: [home], tasks: [], logs: [], warranties: [], appliances: [], projects: [], expenses: [], contacts: [], proJobs: [], purchases: [],
    seasonChecks: {},
    docs: all.docs.map((d) => ({ ...d, photos: ['deed__Deed.pdf'] })),
    policies: all.policies,
    claims: all.claims,
    members: [{ id: 'm', name: 'Nick', role: 'owner', color: 'green' }],
    chores: [{ id: 'ch', title: 'Trash', everyDays: 7, startAt: today }],
    choreLogs: [{ id: 'cl', choreId: 'ch', doneAt: today }],
    settings: { remindersOn: true, leadDays: 7, householdPin: '1234' },
  };
  const names = photoNames(data);
  for (const n of ['deed__Deed.pdf', 'dec.pdf', 'hail.jpg', 'estimate.pdf']) assert.ok(names.includes(n), n);
  const back = parseBackup(buildBackup(data, {}, 'now'));
  assert.equal(back.data.policies.length, 2);
  assert.equal(back.data.members[0].name, 'Nick');
  assert.equal(back.data.choreLogs.length, 1);
  // A backup from version 1.0 has none of the new lists.
  const old = JSON.parse(buildBackup(data, {}, 'now'));
  for (const k of ['docs', 'policies', 'claims', 'members', 'chores', 'choreLogs']) delete old.data[k];
  const fromOld = parseBackup(JSON.stringify(old));
  assert.deepEqual(fromOld.data.docs, []);
  assert.deepEqual(fromOld.data.chores, []);
});

test('hand off: only papers the seller picks go along', () => {
  const lists = {
    assets: [home], tasks: [], logs: [], warranties: [], appliances: [], projects: [], expenses: [], contacts: [], proJobs: [], purchases: [],
    docs: [
      { id: 'd1', assetId: 'h', category: 'permit', title: 'Roof permit', photos: [] },
      { id: 'd2', assetId: 'h', category: 'mortgage', title: 'Loan', photos: [] },
    ],
  };
  const none = selectTransfer(lists, 'h', { includeCosts: false, warrantyIds: [] });
  assert.equal(none.docs.length, 0);
  const one = selectTransfer(lists, 'h', { includeCosts: false, warrantyIds: [], docIds: ['d1'] });
  assert.deepEqual(one.docs.map((d) => d.title), ['Roof permit']);
  let n = 0;
  const { data } = prepareImport(one, [], () => `new${++n}`);
  assert.equal(data.docs[0].assetId, data.assets[0].id);
  assert.notEqual(data.docs[0].id, 'd1');
});
