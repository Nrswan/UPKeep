/**
 * Year, make and model choices for the add vehicle form.
 *
 * Makes are a fixed list of brands sold in the US. Models are looked up live
 * from NHTSA's free vPIC service (no key needed). If the phone is offline or
 * the lookup fails, the form lets the user type the model instead.
 */

const NEXT_YEAR = new Date().getFullYear() + 1;
export const YEARS: string[] = Array.from({ length: NEXT_YEAR - 1980 }, (_, i) => String(NEXT_YEAR - i));

export const MAKES: string[] = [
  'Acura', 'Alfa Romeo', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge', 'Fiat', 'Ford',
  'Genesis', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar', 'Jeep', 'Kia', 'Land Rover', 'Lexus', 'Lincoln',
  'Lucid', 'Maserati', 'Mazda', 'Mercedes-Benz', 'Mercury', 'Mini', 'Mitsubishi', 'Nissan', 'Oldsmobile',
  'Plymouth', 'Polestar', 'Pontiac', 'Porsche', 'Ram', 'Rivian', 'Saab', 'Saturn', 'Scion', 'Subaru', 'Suzuki',
  'Tesla', 'Toyota', 'Volkswagen', 'Volvo',
];

const cache = new Map<string, string[]>();

type VpicResponse = { Results?: { Model_Name?: string }[] };

/** Models a make sold in a given year. Resolves to an empty list when the lookup fails. */
export async function fetchModels(make: string, year: string): Promise<string[]> {
  const key = `${year}|${make}`.toLowerCase();
  const hit = cache.get(key);
  if (hit) return hit;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(
      make
    )}/modelyear/${encodeURIComponent(year)}?format=json`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return [];
    const data = (await res.json()) as VpicResponse;
    const names = new Set<string>();
    for (const r of data.Results ?? []) {
      const n = r.Model_Name?.trim();
      if (n) names.add(n);
    }
    const models = [...names].sort((a, b) => a.localeCompare(b));
    if (models.length) cache.set(key, models);
    return models;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export function vehicleLabel(v: { year?: number | string; make?: string; model?: string }): string {
  return [v.year, v.make, v.model].filter(Boolean).join(' ');
}
