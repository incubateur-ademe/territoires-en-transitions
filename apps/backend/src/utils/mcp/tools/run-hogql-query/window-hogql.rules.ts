/**
 * Découpage d'une requête HogQL par mois, pour contourner la limite de
 * 50 000 lignes par requête de l'API PostHog. Portée du dashboard de Baptiste
 * (BaptisteTCS/dashboard_tet, utils/posthog_api.py).
 */
export const HOGQL_WINDOW_ROW_LIMIT = 50_000;
export const HOGQL_MAX_WINDOWS = 24;
export const HOGQL_MAX_TOTAL_ROWS = 200_000;

const START_MARKER = '{start}';
const END_MARKER = '{end}';

export type HogqlWindow = {
  /** `YYYY-MM-DD HH:MM:SS` en UTC, tel qu'attendu par `toDateTime(x, 'UTC')`. */
  start: string;
  end: string;
};

export type HogqlWindows =
  | { ok: true; windows: HogqlWindow[] }
  | { ok: false; reason: string };

export function hasWindowMarkers(hogql: string): boolean {
  return hogql.includes(START_MARKER) && hogql.includes(END_MARKER);
}

export function applyWindow(hogql: string, window: HogqlWindow): string {
  return hogql
    .replaceAll(START_MARKER, window.start)
    .replaceAll(END_MARKER, window.end);
}

export function formatHogqlDate(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

export function buildMonthlyWindows({
  dateFrom,
  dateTo,
  now = new Date(),
}: {
  dateFrom: string;
  dateTo?: string | null;
  now?: Date;
}): HogqlWindows {
  const start = parseUtcDate(dateFrom);
  if (!start) {
    return { ok: false, reason: `date_from invalide : ${dateFrom}` };
  }
  const end = dateTo ? parseUtcDate(dateTo) : now;
  if (!end) {
    return { ok: false, reason: `date_to invalide : ${dateTo}` };
  }
  if (start >= end) {
    return {
      ok: false,
      reason: 'Plage de dates vide (date_from >= date_to).',
    };
  }

  const windows: HogqlWindow[] = [];
  let cursor = start;
  while (cursor < end) {
    const next = addUtcMonth(cursor);
    const windowEnd = next < end ? next : end;
    windows.push({
      start: formatHogqlDate(cursor),
      end: formatHogqlDate(windowEnd),
    });
    if (windows.length > HOGQL_MAX_WINDOWS) {
      return {
        ok: false,
        reason: `Plage trop longue : plus de ${HOGQL_MAX_WINDOWS} mois. Réduis la période.`,
      };
    }
    cursor = next;
  }
  return { ok: true, windows };
}

/** Une date seule est lue à minuit UTC ; une date-heure sans fuseau aussi. */
function parseUtcDate(value: string): Date | null {
  const trimmed = value.trim();
  const hasTimezone = /(Z|[+-]\d{2}:?\d{2})$/i.test(trimmed);
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? `${trimmed}T00:00:00Z`
    : hasTimezone
    ? trimmed
    : `${trimmed.replace(' ', 'T')}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addUtcMonth(date: Date): Date {
  const next = new Date(date);
  const day = next.getUTCDate();
  next.setUTCDate(1);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const lastDayOfMonth = new Date(
    Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)
  ).getUTCDate();
  next.setUTCDate(Math.min(day, lastDayOfMonth));
  return next;
}
