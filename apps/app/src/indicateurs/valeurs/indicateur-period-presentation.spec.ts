import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  INDICATEUR_PERIODICITE_OPTIONS,
  makeIndicateurPeriodTimeAxis,
} from './indicateur-period-presentation';

describe('options de périodicité des indicateurs', () => {
  it('propose les périodicités annuelle et mensuelle pour toutes les collectivités', () => {
    expect(INDICATEUR_PERIODICITE_OPTIONS.map(({ value }) => value)).toEqual([
      'annuelle',
      'mensuelle',
    ]);
  });
});

describe('axe temporel des indicateurs', () => {
  const initialTimeZone = process.env.TZ;

  beforeAll(() => {
    process.env.TZ = 'Pacific/Tahiti';
  });

  afterAll(() => {
    if (initialTimeZone === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = initialTimeZone;
    }
  });

  it('formate les graduations mensuelles à partir des instants UTC ECharts', () => {
    const timeAxis = makeIndicateurPeriodTimeAxis('mensuelle');

    expect(new Date(Date.UTC(2026, 1, 1)).getMonth()).toBe(0);
    expect(timeAxis.formatter?.(Date.UTC(2026, 1, 1))).toBe('février 2026');
  });

  it('garde les graduations annuelles dans leur année UTC', () => {
    const timeAxis = makeIndicateurPeriodTimeAxis('annuelle');

    expect(new Date(Date.UTC(2030, 0, 1)).getFullYear()).toBe(2029);
    expect(timeAxis.formatter?.(Date.UTC(2030, 0, 1))).toBe('2030');
  });

  it('active explicitement la base de temps UTC', () => {
    expect(makeIndicateurPeriodTimeAxis('mensuelle').useUTC).toBe(true);
  });

  it('affiche des repères annuels et conserve le mois de la valeur au survol', () => {
    const timeAxis = makeIndicateurPeriodTimeAxis('mensuelle', 'annuelle');
    const february = Date.UTC(2026, 1, 1);

    expect(timeAxis.formatter?.(february)).toBe('2026');
    expect(timeAxis.axisPointerFormatter?.(february)).toBe('février 2026');
  });

  it('refuse un affichage plus fin que la déclaration', () => {
    expect(() =>
      makeIndicateurPeriodTimeAxis('annuelle', 'mensuelle')
    ).toThrow();
  });
});
