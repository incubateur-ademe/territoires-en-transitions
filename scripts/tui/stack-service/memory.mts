// Dégradé mémoire : interpolation RGB linéaire entre jalons (GiB → couleur),
// clampée aux extrêmes, appliquée à la mesure d'un conteneur et au total de
// la stack. Aucune dépendance : pure lecture/formatage des chaînes émises
// par docker (« 885.2MiB », « 1.8GiB »).
type GradientStop = [gib: number, rgb: [number, number, number]];

// Par conteneur : bleu (repos) → vert → orange → rouge, plafond 5 GiB.
const SERVICE_MEM_STOPS: GradientStop[] = [
  [0, [0x61, 0xaf, 0xef]], // bleu
  [1.5, [0x98, 0xc3, 0x79]], // vert
  [3, [0xff, 0x87, 0x00]], // orange
  [5, [0xff, 0x5f, 0x5f]], // rouge : ≥ 5 GiB
];

// Total de la stack : vert jusqu'à 10 GiB, rouge à partir de 20 GiB.
const TOTAL_MEM_STOPS: GradientStop[] = [
  [10, [0x98, 0xc3, 0x79]], // vert
  [15, [0xff, 0x87, 0x00]], // orange
  [20, [0xff, 0x5f, 0x5f]], // rouge
];

// Unités mémoire émises par docker (binaires, plus les variantes SI par
// prudence — go-units les produit selon les champs).
const MEM_UNITS: Record<string, number> = {
  B: 1,
  KiB: 1024,
  MiB: 1024 ** 2,
  GiB: 1024 ** 3,
  TiB: 1024 ** 4,
  kB: 1000,
  MB: 1000 ** 2,
  GB: 1000 ** 3,
};

const parseMemory = (value: string): number | null => {
  const m = /^([\d.]+)\s*([A-Za-z]+)$/.exec(value.trim());
  if (!m) return null;
  const unit = MEM_UNITS[m[2]];
  return unit ? Number(m[1]) * unit : null;
};

const toHex = (rgb: [number, number, number]): string =>
  `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`;

const gradientColor = (bytes: number, stops: GradientStop[]): string => {
  const gib = bytes / 1024 ** 3;
  if (gib <= stops[0][0]) return toHex(stops[0][1]);
  for (let i = 1; i < stops.length; i++) {
    const [stopGib, rgb] = stops[i];
    if (gib <= stopGib) {
      const [prevGib, prevRgb] = stops[i - 1];
      const t = (gib - prevGib) / (stopGib - prevGib);
      return toHex([
        Math.round(prevRgb[0] + (rgb[0] - prevRgb[0]) * t),
        Math.round(prevRgb[1] + (rgb[1] - prevRgb[1]) * t),
        Math.round(prevRgb[2] + (rgb[2] - prevRgb[2]) * t),
      ]);
    }
  }
  return toHex(stops[stops.length - 1][1]);
};

// Couleur de la mesure d'un conteneur (« 885.2MiB ») — undefined si illisible.
export const memColor = (value: string | undefined): string | undefined => {
  const bytes = value ? parseMemory(value) : null;
  return bytes === null ? undefined : gradientColor(bytes, SERVICE_MEM_STOPS);
};

// Somme des mesures « 885.2MiB »/« 1.8GiB » → total lisible et sa couleur,
// null si rien.
export const totalMemory = (
  values: Iterable<string>
): { label: string; color: string } | null => {
  let bytes = 0;
  let found = false;
  for (const value of values) {
    const parsed = parseMemory(value);
    if (parsed !== null) {
      bytes += parsed;
      found = true;
    }
  }
  if (!found) return null;
  const label =
    bytes >= 1024 ** 3
      ? `${(bytes / 1024 ** 3).toFixed(2)}GiB`
      : `${(bytes / 1024 ** 2).toFixed(1)}MiB`;
  return { label, color: gradientColor(bytes, TOTAL_MEM_STOPS) };
};
