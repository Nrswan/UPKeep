import { APP_NAME } from './brand';
import { addMonths, describeMonths, formatDate, warrantyInfo } from './due';
import { claimStatus, docCategory, insuranceFacts, isPdf, policyType, recentClaims, yearlyPremium } from './insurance';
import { esc, REPORT_CSS, table, usd } from './report';
import type { Appliance, Asset, Claim, Contact, Expense, HomeDoc, LogEntry, Policy, ProJob, Project, Task, WarrantyItem } from './types';

/**
 * A summary of one home or vehicle for an insurance agent or adjuster. It
 * answers the questions they ask when quoting, renewing or handling a claim:
 * the building and its systems, safety features, updates, upkeep and past
 * claims. Text from the owner is escaped before it goes into the page.
 */
export type InsuranceReportInput = {
  asset: Asset;
  policies: Policy[];
  claims: Claim[];
  appliances: Appliance[];
  warranties: WarrantyItem[];
  projects: Project[];
  expenses: Expense[];
  proJobs: ProJob[];
  contacts: Contact[];
  tasks: Task[];
  logs: LogEntry[];
  docs: HomeDoc[];
  today: string;
  /** Leave out premiums, prices and amounts paid. */
  hideCosts?: boolean;
  /** Saved photo name to something an <img> can load, such as a data URI. */
  photoSrc?: Record<string, string>;
};

/** Photos worth showing an agent, in order: the place itself, claims, then appliance plates. At most 12. */
export function insurancePhotoNames(input: Pick<InsuranceReportInput, 'asset' | 'claims' | 'appliances'>): string[] {
  const out: string[] = [];
  const add = (n?: string) => {
    if (n && !isPdf(n) && !out.includes(n) && out.length < 12) out.push(n);
  };
  add(input.asset.photo);
  for (const c of input.claims.filter((c) => c.assetId === input.asset.id)) c.photos.forEach(add);
  for (const a of input.appliances.filter((a) => a.assetId === input.asset.id)) add(a.photos[0]);
  return out;
}

export function buildInsuranceHtml(input: InsuranceReportInput): string {
  const { asset, today } = input;
  const money = (n?: number) => (n == null || input.hideCosts ? '' : usd(n));
  const isHome = asset.kind === 'home';
  const factByLabel = new Map((asset.facts ?? []).map((f) => [f.label.toLowerCase(), f.value]));
  const policies = input.policies.filter((p) => p.assetId === asset.id);
  const policyIds = new Set(policies.map((p) => p.id));
  const claims = recentClaims(
    input.claims.filter((c) => c.assetId === asset.id || (c.policyId && policyIds.has(c.policyId))),
    today
  );
  const appliances = input.appliances.filter((a) => a.assetId === asset.id);
  const projects = input.projects.filter((p) => p.assetId === asset.id);
  const contactById = new Map(input.contacts.map((c) => [c.id, c]));
  const proJobs = input.proJobs.filter((j) => j.assetId === asset.id).sort((a, b) => b.date.localeCompare(a.date));
  const taskById = new Map(input.tasks.filter((t) => t.assetId === asset.id).map((t) => [t.id, t]));
  const since = addMonths(today, -36);
  const logs = input.logs.filter((l) => l.assetId === asset.id && l.doneAt >= since).sort((a, b) => b.doneAt.localeCompare(a.doneAt));
  const docs = input.docs.filter((d) => d.assetId === asset.id);

  const parts: string[] = [];

  const kindLine = isHome
    ? asset.rental
      ? 'Rental property'
      : 'Home'
    : [asset.year, asset.make, asset.model].filter(Boolean).join(' ') || 'Vehicle';
  const address = factByLabel.get('address');
  parts.push(
    `<h1>${esc(asset.name)}</h1><p class="sub">${esc([kindLine, address].filter(Boolean).join('  ·  '))}</p><p class="sub">Insurance summary prepared by the owner on ${esc(
      formatDate(today)
    )}</p>`
  );

  // Coverage
  if (policies.length) {
    parts.push(
      `<h2>Current coverage</h2>${table(
        ['Policy', 'Company and number', 'Coverage', 'Deductible', 'Premium per year', 'Renews'],
        policies.map((p) => [
          esc(policyType(p.type).label),
          esc(p.company) + (p.policyNumber ? `<div class="muted">#${esc(p.policyNumber)}</div>` : '') + (p.agentName ? `<div class="muted">Agent: ${esc(p.agentName)}${p.agentPhone ? `, ${esc(p.agentPhone)}` : ''}</div>` : ''),
          esc(money(p.coverage)),
          esc(money(p.deductible)),
          esc(money(yearlyPremium(p))),
          p.renewsAt ? esc(formatDate(p.renewsAt)) : '',
        ]),
        [2, 3, 4]
      )}`
    );
  }

  // Property details, grouped the way agents ask
  const facts = insuranceFacts(asset.kind);
  const groups = [...new Set(facts.map((f) => f.group))];
  const rows: string[][] = [];
  for (const g of groups) {
    const filled = facts.filter((f) => f.group === g && f.label !== 'Address' && factByLabel.get(f.label.toLowerCase()));
    if (!filled.length) continue;
    rows.push([`<b>${esc(g)}</b>`, '']);
    for (const f of filled) rows.push([esc(f.label), esc(factByLabel.get(f.label.toLowerCase()))]);
  }
  if (!isHome) {
    if (asset.mileage != null) rows.unshift(['Odometer', esc(`${asset.mileage.toLocaleString('en-US')} miles`)]);
  }
  if (rows.length) parts.push(`<h2>${isHome ? 'About the home' : 'About the vehicle'}</h2>${table(['Item', 'Detail'], rows)}`);

  // Systems and appliances
  if (appliances.length) {
    parts.push(
      `<h2>Systems and appliances (${appliances.length})</h2>${table(
        ['Appliance', 'Brand', 'Model', 'Notes'],
        appliances.map((a) => [esc(a.name), esc(a.brand), esc(a.model), esc(a.note)])
      )}`
    );
  }

  // Updates and improvements
  const improvements: { date: string; row: string[] }[] = [];
  for (const p of projects) {
    const spent = input.expenses.filter((e) => e.projectId === p.id).reduce((sum, e) => sum + Math.round(e.amount * 100), 0);
    improvements.push({
      date: p.startedAt,
      row: [esc(formatDate(p.startedAt)), esc(p.name) + `<div class="muted">${p.done ? 'Finished' : 'In progress'}, done by the owner</div>`, esc(spent ? money(spent / 100) : '')],
    });
  }
  for (const j of proJobs) {
    const who = contactById.get(j.contactId);
    improvements.push({
      date: j.date,
      row: [esc(formatDate(j.date)), esc(j.title) + (who ? `<div class="muted">By ${esc(who.name)}${who.trade ? `, ${esc(who.trade)}` : ''}</div>` : ''), esc(money(j.cost))],
    });
  }
  if (improvements.length) {
    improvements.sort((a, b) => b.date.localeCompare(a.date));
    parts.push(`<h2>Updates and improvements (${improvements.length})</h2>${table(['Date', 'Work', 'Cost'], improvements.map((i) => i.row), [2])}`);
  }

  // Upkeep
  if (logs.length) {
    parts.push(
      `<h2>Upkeep in the last 3 years (${logs.length})</h2>${table(
        ['Date', 'Work done', 'Done by'],
        logs.map((l) => [
          esc(formatDate(l.doneAt)),
          esc(taskById.get(l.taskId)?.title ?? 'Upkeep'),
          esc(l.contactId ? (contactById.get(l.contactId)?.name ?? 'A pro') : 'Owner'),
        ])
      )}`
    );
  }

  // Warranties still running
  const live = input.warranties.map((w) => ({ w, info: warrantyInfo(w, today) })).filter((x) => x.info.status !== 'expired');
  if (isHome && live.length) {
    parts.push(
      `<h2>Warranties in effect (${live.length})</h2>${table(
        ['Item', 'Length', 'Ends'],
        live.map(({ w, info }) => [esc(w.name), esc(describeMonths(w.months)), esc(formatDate(info.expiresAt))])
      )}`
    );
  }

  // Claims
  parts.push('<h2>Claims in the last 5 years</h2>');
  if (claims.length) {
    parts.push(
      table(
        ['Date of loss', 'What happened', 'Claim number', 'Status', 'Paid'],
        claims.map((c) => [esc(formatDate(c.date)), esc(c.title), esc(c.claimNumber), esc(claimStatus(c.status).label), esc(money(c.paid))]),
        [4]
      )
    );
  } else {
    parts.push('<p>None recorded.</p>');
  }

  // Papers
  if (docs.length) {
    parts.push(
      `<h2>Documents on file (${docs.length})</h2>${table(
        ['Document', 'Kind', 'Date'],
        docs.map((d) => [esc(d.title), esc(docCategory(d.category).label), d.date ? esc(formatDate(d.date)) : ''])
      )}<p class="muted">Copies are available from the owner on request.</p>`
    );
  }

  // Photos
  const srcs = insurancePhotoNames(input)
    .map((n) => input.photoSrc?.[n])
    .filter((s): s is string => !!s && /^(data:image\/|blob:|https?:|file:)/.test(s));
  if (srcs.length) {
    parts.push(`<h2>Photos</h2><div class="photos">${srcs.map((s) => `<img src="${esc(s)}">`).join('')}</div>`);
  }

  parts.push(
    `<p class="foot">Made with ${esc(APP_NAME)} on ${esc(formatDate(today))}. Details are as entered by the owner and have not been checked by an inspector or the insurance company.</p>`
  );

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(
    asset.name
  )} insurance summary</title><style>${REPORT_CSS}.photos{display:flex;flex-wrap:wrap;gap:8px}.photos img{width:31%;height:150px;object-fit:cover;border-radius:6px;page-break-inside:avoid}</style></head><body>${parts.join('')}</body></html>`;
}
