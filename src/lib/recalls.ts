/**
 * Safety recall lookup from NHTSA's free public API. No key needed.
 *
 * Results are for the year, make and model in general. Whether one specific
 * vehicle is affected, or already repaired, takes a VIN check on nhtsa.gov.
 */
export type Recall = {
  campaign: string;
  component: string;
  summary: string;
  consequence: string;
  remedy: string;
  /** As reported by NHTSA, usually DD/MM/YYYY. */
  reported: string;
};

export const RECALL_LOOKUP_URL = 'https://www.nhtsa.gov/recalls';

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** Turns the API response into a clean list. Tolerates changes in key capitalization. */
export function normalizeRecalls(json: unknown): Recall[] {
  if (!json || typeof json !== 'object') return [];
  const top = lowerKeys(json as Record<string, unknown>);
  const rows = Array.isArray(top.results) ? top.results : [];
  const out: Recall[] = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const r = lowerKeys(row as Record<string, unknown>);
    const recall: Recall = {
      campaign: str(r.nhtsacampaignnumber),
      component: str(r.component),
      summary: str(r.summary),
      consequence: str(r.consequence),
      remedy: str(r.remedy),
      reported: str(r.reportreceiveddate),
    };
    if (recall.campaign || recall.summary) out.push(recall);
  }
  return out;
}

function lowerKeys(o: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) out[k.toLowerCase()] = v;
  return out;
}

export type RecallResult = { ok: true; recalls: Recall[] } | { ok: false };

export async function fetchRecalls(make: string, model: string, year: number | string): Promise<RecallResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const url = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(
      model
    )}&modelYear=${encodeURIComponent(String(year))}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return { ok: false };
    return { ok: true, recalls: normalizeRecalls(await res.json()) };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}
