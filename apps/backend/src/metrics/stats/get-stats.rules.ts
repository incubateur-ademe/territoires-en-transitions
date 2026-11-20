import { StatsPeriodicity } from './get-stats.input';
import { Stat } from './get-stats.output';

/**
 * Règles de la route `/api/stats` (spec de l'Accélérateur de la transition
 * écologique) : périodes calées sur leur début en UTC, semaines ISO (lundi),
 * valeurs non cumulées et périodes vides comblées à 0.
 */

/** Nombre de fiches créées sur une période, clé `YYYY-MM-DD` du début de période (UTC). */
export type PeriodCount = { periode: string; count: number };

/** Durée maximale de cache, même quand la période se termine plus tard. */
export const STATS_CACHE_MAX_AGE_SECONDS = 3600;

const PERIODICITY_LABELS: Record<StatsPeriodicity, string> = {
  day: 'jour',
  week: 'semaine',
  month: 'mois',
  year: 'an',
};

export function getStatsDescription(periodicity: StatsPeriodicity): string {
  return `Nombre de fiches action créées par ${PERIODICITY_LABELS[periodicity]}`;
}

/** Début (00:00 UTC) de la période qui contient `date`. */
export function getPeriodStart(
  date: Date,
  periodicity: StatsPeriodicity
): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  switch (periodicity) {
    case 'day':
      return new Date(Date.UTC(year, month, day));
    case 'week': {
      // getUTCDay : 0 = dimanche. On revient au lundi précédent (ou au jour même).
      const daysSinceMonday = (date.getUTCDay() + 6) % 7;
      return new Date(Date.UTC(year, month, day - daysSinceMonday));
    }
    case 'month':
      return new Date(Date.UTC(year, month, 1));
    case 'year':
      return new Date(Date.UTC(year, 0, 1));
  }
}

/** Décale un début de période de `count` périodes (négatif pour reculer). */
export function addPeriods(
  periodStart: Date,
  periodicity: StatsPeriodicity,
  count: number
): Date {
  const year = periodStart.getUTCFullYear();
  const month = periodStart.getUTCMonth();
  const day = periodStart.getUTCDate();
  switch (periodicity) {
    case 'day':
      return new Date(Date.UTC(year, month, day + count));
    case 'week':
      return new Date(Date.UTC(year, month, day + 7 * count));
    case 'month':
      return new Date(Date.UTC(year, month + count, 1));
    case 'year':
      return new Date(Date.UTC(year + count, 0, 1));
  }
}

/**
 * Début de la première période renvoyée quand `since` est fourni : `since`
 * périodes, celle en cours comprise. `null` sans `since` (tout l'historique).
 */
export function getSeriesStart({
  now,
  periodicity,
  since,
}: {
  now: Date;
  periodicity: StatsPeriodicity;
  since?: number;
}): Date | null {
  if (since === undefined) {
    return null;
  }
  return addPeriods(
    getPeriodStart(now, periodicity),
    periodicity,
    -(since - 1)
  );
}

const toPeriodKey = (date: Date): string => date.toISOString().slice(0, 10);

const parsePeriodKey = (periode: string): Date =>
  new Date(`${periode}T00:00:00.000Z`);

/**
 * Série continue de la première période à la période en cours (incluse),
 * une valeur par période, 0 quand rien n'a été créé.
 *
 * - avec `since` : exactement `since` points ;
 * - sans `since` : depuis la période de la première fiche créée (ou
 *   seulement la période en cours s'il n'y en a aucune).
 */
export function buildStatsSeries({
  counts,
  now,
  periodicity,
  since,
}: {
  counts: PeriodCount[];
  now: Date;
  periodicity: StatsPeriodicity;
  since?: number;
}): Stat[] {
  const currentStart = getPeriodStart(now, periodicity);
  const countByPeriode = new Map(
    counts.map(({ periode, count }) => [periode, count])
  );

  const firstPeriode = counts
    .map(({ periode }) => periode)
    .sort()
    .at(0);
  const start =
    getSeriesStart({ now, periodicity, since }) ??
    (firstPeriode ? parsePeriodKey(firstPeriode) : currentStart);

  const stats: Stat[] = [];
  for (
    let periodStart = start;
    periodStart.getTime() <= currentStart.getTime();
    periodStart = addPeriods(periodStart, periodicity, 1)
  ) {
    stats.push({
      value: countByPeriode.get(toPeriodKey(periodStart)) ?? 0,
      date: periodStart.getTime(),
    });
  }
  return stats;
}

/**
 * Durée de cache (`max-age`) : jamais au-delà de la fin de la période en
 * cours (spec), et plafonnée à une heure pour que la valeur de la période en
 * cours reste fraîche.
 */
export function getCacheMaxAgeSeconds({
  now,
  periodicity,
}: {
  now: Date;
  periodicity: StatsPeriodicity;
}): number {
  const nextPeriodStart = addPeriods(
    getPeriodStart(now, periodicity),
    periodicity,
    1
  );
  const secondsUntilPeriodEnd = Math.floor(
    (nextPeriodStart.getTime() - now.getTime()) / 1000
  );
  return Math.max(
    0,
    Math.min(STATS_CACHE_MAX_AGE_SECONDS, secondsUntilPeriodEnd)
  );
}
