import { describeMonths, formatDate, warrantyInfo } from './due';
import type { Appliance, Asset, Expense, LogEntry, Project, Task, WarrantyItem } from './types';

/**
 * Builds a printable record for one home or vehicle as an HTML page. The page
 * is turned into a PDF by the phone. Everything in it comes from what the
 * owner entered, so all text is escaped before it goes into the page.
 */
export type ReportInput = {
  asset: Asset;
  tasks: Task[];
  logs: LogEntry[];
  appliances: Appliance[];
  warranties: WarrantyItem[];
  projects: Project[];
  expenses: Expense[];
  today: string;
};

export function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Spending per calendar year, newest first. Amounts are summed in cents. */
export function spendingByYear(
  logs: Pick<LogEntry, 'doneAt' | 'cost'>[],
  expenses: Pick<Expense, 'date' | 'amount'>[]
): { year: string; maintenance: number; diy: number; total: number }[] {
  const years = new Map<string, { m: number; d: number }>();
  const row = (y: string) => {
    let r = years.get(y);
    if (!r) years.set(y, (r = { m: 0, d: 0 }));
    return r;
  };
  for (const l of logs) if (l.cost) row(l.doneAt.slice(0, 4)).m += Math.round(l.cost * 100);
  for (const e of expenses) row(e.date.slice(0, 4)).d += Math.round(e.amount * 100);
  return [...years.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([year, r]) => ({ year, maintenance: r.m / 100, diy: r.d / 100, total: (r.m + r.d) / 100 }));
}

function table(head: string[], rows: string[][], rightCols: number[] = []): string {
  const cls = (i: number) => (rightCols.includes(i) ? ' class="r"' : '');
  return `<table><thead><tr>${head.map((h, i) => `<th${cls(i)}>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c, i) => `<td${cls(i)}>${c}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;
}

export function buildReportHtml(input: ReportInput): string {
  const { asset, today } = input;
  const isHome = asset.kind === 'home';
  const tasks = input.tasks.filter((t) => t.assetId === asset.id);
  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const logs = input.logs.filter((l) => l.assetId === asset.id).sort((a, b) => (a.doneAt < b.doneAt ? 1 : -1));
  const appliances = input.appliances.filter((a) => a.assetId === asset.id);
  const applianceById = new Map(appliances.map((a) => [a.id, a]));
  const projects = input.projects.filter((p) => p.assetId === asset.id);
  const projectIds = new Set(projects.map((p) => p.id));
  const expenses = input.expenses.filter((e) => projectIds.has(e.projectId));

  const parts: string[] = [];

  // Header
  const sub = [
    isHome ? (asset.rental ? 'Rental property' : 'Home') : [asset.year, asset.make, asset.model].filter(Boolean).join(' ') || 'Vehicle',
    asset.mileage != null ? `${asset.mileage.toLocaleString('en-US')} miles` : '',
  ]
    .filter(Boolean)
    .join('  ·  ');
  parts.push(`<h1>${esc(asset.name)}</h1><p class="sub">${esc(sub)}</p><p class="sub">Maintenance record as of ${esc(formatDate(today))}</p>`);

  // Facts
  if (asset.facts?.length) {
    parts.push(`<h2>Good to know</h2>${table(['Item', 'Detail'], asset.facts.map((f) => [esc(f.label), esc(f.value)]))}`);
  }

  // Appliances
  if (appliances.length) {
    parts.push(
      `<h2>Appliances and systems</h2>${table(
        ['Appliance', 'Brand', 'Model', 'Serial number', 'Notes'],
        appliances.map((a) => [esc(a.name), esc(a.brand), esc(a.model), esc(a.serial), esc(a.note)])
      )}`
    );
  }

  // Service history
  if (logs.length) {
    const rows = logs.map((l) => {
      const task = taskById.get(l.taskId);
      const appliance = task?.applianceId ? applianceById.get(task.applianceId) : undefined;
      const details = [
        l.miles != null ? `${l.miles.toLocaleString('en-US')} mi` : '',
        ...(l.specs ?? []).map((s) => `${s.label}: ${s.value}`),
        l.note ?? '',
      ]
        .filter(Boolean)
        .map(esc)
        .join('<br>');
      return [
        esc(formatDate(l.doneAt)),
        esc(task?.title ?? 'Removed task') + (appliance ? `<div class="muted">${esc(appliance.name)}</div>` : ''),
        details,
        l.cost != null ? esc(usd(l.cost)) : '',
      ];
    });
    parts.push(`<h2>Service history (${logs.length})</h2>${table(['Date', 'Work done', 'Details', 'Cost'], rows, [3])}`);
  } else {
    parts.push('<h2>Service history</h2><p class="muted">Nothing logged yet.</p>');
  }

  // Projects
  if (projects.length) {
    const rows = projects.map((p) => {
      const mine = expenses.filter((e) => e.projectId === p.id);
      const cents = mine.reduce((sum, e) => sum + Math.round(e.amount * 100), 0);
      const cats = new Map<string, number>();
      for (const e of mine) cats.set(e.category, (cats.get(e.category) ?? 0) + Math.round(e.amount * 100));
      const breakdown = [...cats.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([c, v]) => `${esc(c)} ${esc(usd(v / 100))}`)
        .join('<br>');
      return [
        esc(p.name) + (p.note ? `<div class="muted">${esc(p.note)}</div>` : ''),
        esc(`${formatDate(p.startedAt)}${p.done ? '  ·  Finished' : '  ·  In progress'}`),
        breakdown,
        esc(usd(cents / 100)),
      ];
    });
    parts.push(`<h2>Projects and improvements (${projects.length})</h2>${table(['Project', 'Started', 'Spending', 'Total'], rows, [3])}`);
  }

  // Spending
  const years = spendingByYear(logs, expenses);
  if (years.length) {
    const head = isHome ? ['Year', 'Maintenance', 'Projects', 'Total'] : ['Year', 'Maintenance'];
    const rows = years.map((y) =>
      isHome ? [esc(y.year), esc(usd(y.maintenance)), esc(usd(y.diy)), `<b>${esc(usd(y.total))}</b>`] : [esc(y.year), esc(usd(y.maintenance))]
    );
    parts.push(`<h2>Spending by year</h2>${table(head, rows, isHome ? [1, 2, 3] : [1])}`);
  }

  // Warranties are not tied to one home, so they go on every home report.
  if (isHome && input.warranties.length) {
    const rows = input.warranties
      .map((w) => ({ w, info: warrantyInfo(w, today) }))
      .sort((a, b) => (a.info.expiresAt < b.info.expiresAt ? -1 : 1))
      .map(({ w, info }) => [
        esc(w.name) + (w.note ? `<div class="muted">${esc(w.note)}</div>` : ''),
        esc(formatDate(w.purchasedAt)),
        esc(describeMonths(w.months)),
        esc(`${formatDate(info.expiresAt)}${info.status === 'expired' ? ' (ended)' : ''}`),
        esc(w.retailer),
      ]);
    parts.push(`<h2>Warranties on file (${rows.length})</h2>${table(['Item', 'Purchased', 'Length', 'Ends', 'Bought from'], rows)}`);
  }

  // Upkeep schedule
  if (tasks.length) {
    const rows = tasks.map((t) => {
      const every = [t.everyMonths ? `${t.everyMonths} mo` : '', t.everyMiles ? `${t.everyMiles.toLocaleString('en-US')} mi` : ''].filter(Boolean).join(' or ');
      const last = logs.find((l) => l.taskId === t.id);
      return [esc(t.title), esc(every), last ? esc(formatDate(last.doneAt)) : '<span class="muted">Not logged</span>'];
    });
    parts.push(`<h2>Upkeep schedule (${tasks.length})</h2>${table(['Job', 'Every', 'Last done'], rows)}`);
  }

  parts.push(
    `<p class="foot">Made with Upkeep on ${esc(formatDate(today))}. This record lists what the owner entered and is not an inspection, appraisal or guarantee of condition.</p>`
  );

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(
    asset.name
  )} maintenance record</title><style>
*{box-sizing:border-box}body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#16201B;font-size:12px;line-height:1.45;margin:28px}
h1{font-size:24px;margin:0 0 2px}h2{font-size:14px;margin:22px 0 6px;padding-bottom:4px;border-bottom:2px solid #1F6F54;color:#1F6F54}
.sub{margin:0;color:#5E6B64;font-size:12px}.muted{color:#5E6B64;font-size:11px}
table{width:100%;border-collapse:collapse}th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:#5E6B64;border-bottom:1px solid #C9CEC6;padding:4px 6px}
td{padding:5px 6px;border-bottom:1px solid #E8EBE5;vertical-align:top}.r{text-align:right;white-space:nowrap}
tr{page-break-inside:avoid}.foot{margin-top:26px;color:#5E6B64;font-size:10px}
</style></head><body>${parts.join('')}</body></html>`;
}
