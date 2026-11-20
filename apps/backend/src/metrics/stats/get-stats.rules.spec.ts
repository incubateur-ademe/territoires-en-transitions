import { describe, expect, it } from 'vitest';
import {
  addPeriods,
  buildStatsSeries,
  getCacheMaxAgeSeconds,
  getPeriodStart,
  getSeriesStart,
  getStatsDescription,
  STATS_CACHE_MAX_AGE_SECONDS,
} from './get-stats.rules';

const utc = (iso: string) => new Date(`${iso}Z`);
const ts = (isoDate: string) => utc(`${isoDate}T00:00:00.000`).getTime();

describe('getPeriodStart', () => {
  // Mercredi 3 septembre 2025, 15h42 UTC
  const date = utc('2025-09-03T15:42:10.123');

  it.each([
    ['day', '2025-09-03'],
    ['week', '2025-09-01'],
    ['month', '2025-09-01'],
    ['year', '2025-01-01'],
  ] as const)('%s : début de période à 00h UTC', (periodicity, expected) => {
    expect(getPeriodStart(date, periodicity).getTime()).toBe(ts(expected));
  });

  it('une semaine commence le lundi, y compris depuis un dimanche', () => {
    expect(getPeriodStart(utc('2025-09-07T23:59:59'), 'week').getTime()).toBe(
      ts('2025-09-01')
    );
    expect(getPeriodStart(utc('2025-09-08T00:00:00'), 'week').getTime()).toBe(
      ts('2025-09-08')
    );
  });
});

describe('addPeriods', () => {
  it('recule et avance en changeant de mois et d’année', () => {
    expect(addPeriods(utc('2025-01-01T00:00:00'), 'day', -1).getTime()).toBe(
      ts('2024-12-31')
    );
    expect(addPeriods(utc('2025-01-06T00:00:00'), 'week', -1).getTime()).toBe(
      ts('2024-12-30')
    );
    expect(addPeriods(utc('2025-01-01T00:00:00'), 'month', -13).getTime()).toBe(
      ts('2023-12-01')
    );
    expect(addPeriods(utc('2025-01-01T00:00:00'), 'year', 2).getTime()).toBe(
      ts('2027-01-01')
    );
  });
});

describe('getSeriesStart', () => {
  const now = utc('2025-09-03T15:42:00');

  it('sans `since`, pas de borne (tout l’historique)', () => {
    expect(getSeriesStart({ now, periodicity: 'month' })).toBeNull();
  });

  it('`since` compte la période en cours', () => {
    expect(
      getSeriesStart({ now, periodicity: 'month', since: 1 })?.getTime()
    ).toBe(ts('2025-09-01'));
    expect(
      getSeriesStart({ now, periodicity: 'month', since: 12 })?.getTime()
    ).toBe(ts('2024-10-01'));
    expect(
      getSeriesStart({ now, periodicity: 'day', since: 7 })?.getTime()
    ).toBe(ts('2025-08-28'));
  });
});

describe('buildStatsSeries', () => {
  const now = utc('2025-09-07T10:00:00'); // dimanche

  it('comble les jours sans création à 0, sans cumuler (exemple de la spec)', () => {
    const counts = ['01', '02', '03', '04', '05'].map((day) => ({
      periode: `2025-09-${day}`,
      count: 5,
    }));

    expect(
      buildStatsSeries({ counts, now, periodicity: 'day', since: 7 })
    ).toEqual([
      { value: 5, date: ts('2025-09-01') },
      { value: 5, date: ts('2025-09-02') },
      { value: 5, date: ts('2025-09-03') },
      { value: 5, date: ts('2025-09-04') },
      { value: 5, date: ts('2025-09-05') },
      { value: 0, date: ts('2025-09-06') },
      { value: 0, date: ts('2025-09-07') },
    ]);
  });

  it('agrège par semaine quand les comptes arrivent par semaine', () => {
    expect(
      buildStatsSeries({
        counts: [{ periode: '2025-09-01', count: 25 }],
        now,
        periodicity: 'week',
        since: 1,
      })
    ).toEqual([{ value: 25, date: ts('2025-09-01') }]);
  });

  it('avec `since`, renvoie exactement `since` points, même avant la première fiche', () => {
    const stats = buildStatsSeries({
      counts: [{ periode: '2025-09-01', count: 3 }],
      now,
      periodicity: 'month',
      since: 3,
    });

    expect(stats).toEqual([
      { value: 0, date: ts('2025-07-01') },
      { value: 0, date: ts('2025-08-01') },
      { value: 3, date: ts('2025-09-01') },
    ]);
  });

  it('sans `since`, part de la période de la première fiche, dans le désordre', () => {
    const stats = buildStatsSeries({
      counts: [
        { periode: '2025-01-01', count: 4 },
        { periode: '2023-01-01', count: 2 },
      ],
      now,
      periodicity: 'year',
    });

    expect(stats).toEqual([
      { value: 2, date: ts('2023-01-01') },
      { value: 0, date: ts('2024-01-01') },
      { value: 4, date: ts('2025-01-01') },
    ]);
  });

  it('sans donnée ni `since`, renvoie la seule période en cours à 0', () => {
    expect(buildStatsSeries({ counts: [], now, periodicity: 'month' })).toEqual(
      [{ value: 0, date: ts('2025-09-01') }]
    );
  });
});

describe('getCacheMaxAgeSeconds', () => {
  it('ne dépasse pas la fin de la période en cours', () => {
    expect(
      getCacheMaxAgeSeconds({
        now: utc('2025-09-03T23:59:30'),
        periodicity: 'day',
      })
    ).toBe(30);
  });

  it('est plafonné à une heure', () => {
    expect(
      getCacheMaxAgeSeconds({
        now: utc('2025-09-03T10:00:00'),
        periodicity: 'year',
      })
    ).toBe(STATS_CACHE_MAX_AGE_SECONDS);
  });
});

describe('getStatsDescription', () => {
  it('nomme la périodicité en français', () => {
    expect(getStatsDescription('week')).toBe(
      'Nombre de fiches action créées par semaine'
    );
  });
});
