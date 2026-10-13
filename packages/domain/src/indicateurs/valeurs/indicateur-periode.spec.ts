import { describe, expect, it } from 'vitest';
import { IndicateurPeriodiciteEnum } from '../definitions/indicateur-periodicite.schema';
import { IndicateurPeriodeErrorEnum } from './indicateur-periode.errors';
import type { IndicateurPeriode } from './indicateur-periode.types';
import { IndicateurPeriodes } from './indicateur-periode';

describe('IndicateurPeriodes', () => {
  it.each<[string, string | null]>([
    ['', ''],
    ['2', '2'],
    ['20', '20'],
    ['202', '202'],
    ['0000', '0000'],
    ['0001', '0001'],
    ['2026', '2026'],
    ['2a0b2c6', '2026'],
    ['abc-+.,', ''],
    ['20261', null],
    ['2026-01', null],
    ['2026-T1', null],
    ['2026-S1', null],
  ])('normalizes the annual draft %j to %j', (value, expected) => {
    expect(IndicateurPeriodes.normalizeDraft('annuelle', value)).toBe(expected);
  });

  it('accepts incomplete or invalid drafts without making them valid periods', () => {
    for (const value of ['', '2', '20', '202', '0000']) {
      const draft = IndicateurPeriodes.normalizeDraft('annuelle', value);

      expect(draft).toBe(value);
      expect(IndicateurPeriodes.tryParse('annuelle', value)).toBeNull();
    }
  });

  it('merges persisted and draft periods by identity, in chronological order', () => {
    const persisted = [2027, 2025].map(IndicateurPeriodes.fromYear);
    const drafts = [2026, 2025].map(IndicateurPeriodes.fromYear);

    const periodes = IndicateurPeriodes.merge(persisted, drafts);

    expect(periodes.map(IndicateurPeriodes.key)).toEqual([
      'annuelle:2025',
      'annuelle:2026',
      'annuelle:2027',
    ]);
    expect(persisted.map(IndicateurPeriodes.format)).toEqual(['2027', '2025']);
    expect(drafts.map(IndicateurPeriodes.format)).toEqual(['2026', '2025']);
  });

  it('preserves the canonical start date through merging and formatting', () => {
    const periode = IndicateurPeriodes.fromYear(1);

    expect(IndicateurPeriodes.merge([], [periode])).toEqual([
      { periodicite: 'annuelle', dateDebut: '0001-01-01' },
    ]);
    expect(IndicateurPeriodes.format(periode)).toBe('1');
    expect(IndicateurPeriodes.merge()).toEqual([]);
  });

  it.each([
    [2025, false],
    [2026, false],
    [2027, true],
  ] as const)(
    'classifies annual period %i relative to the current period',
    (year, expected) => {
      expect(
        IndicateurPeriodes.isFuture(
          IndicateurPeriodes.fromYear(year),
          new Date(2026, 9, 13)
        )
      ).toBe(expected);
    }
  );

  it('uses the local period boundary when a future period becomes current', () => {
    const periode = IndicateurPeriodes.fromYear(2027);
    expect(
      IndicateurPeriodes.isFuture(periode, new Date(2026, 11, 31, 23, 59, 59))
    ).toBe(true);
    expect(IndicateurPeriodes.isFuture(periode, new Date(2027, 0, 1))).toBe(
      false
    );
  });

  it('compares the containing period rather than the day within it', () => {
    expect(
      IndicateurPeriodes.isFuture(
        IndicateurPeriodes.containing('annuelle', '2026-12-31'),
        new Date(2026, 0, 1)
      )
    ).toBe(false);
  });
});

describe('IndicateurPeriodes — contrat annuel', () => {
  it.each(['0001', '2026', '9999'])(
    'conserve la période annuelle %s et sa date canonique',
    (year) => {
      const periode = IndicateurPeriodes.parse('annuelle', year);

      expect(periode).toEqual({
        periodicite: 'annuelle',
        dateDebut: `${year}-01-01`,
      });
      expect(Object.isFrozen(periode)).toBe(true);
      expect(IndicateurPeriodes.tryParse('annuelle', year)).toEqual(periode);
      expect(IndicateurPeriodes.serialize(periode)).toBe(year);
      expect(IndicateurPeriodes.toDateValeur(periode)).toBe(`${year}-01-01`);
      expect(IndicateurPeriodes.key(periode)).toBe(`annuelle:${year}`);
      expect(
        IndicateurPeriodes.fromDateValeur('annuelle', `${year}-01-01`)
      ).toEqual(periode);
    }
  );

  it('retrouve l’année des dates historiques, y compris un 29 février', () => {
    expect(IndicateurPeriodes.containing('annuelle', '2024-02-29')).toEqual(
      IndicateurPeriodes.parse('annuelle', '2024')
    );
    expect(IndicateurPeriodes.containing('annuelle', '2026-12-31')).toEqual(
      IndicateurPeriodes.parse(IndicateurPeriodiciteEnum.ANNUELLE, '2026')
    );
  });

  it.each(['0000', '26', '2026-01', '2026-T1', '10000'])(
    'refuse la période annuelle invalide %s',
    (value) => {
      expect(() => IndicateurPeriodes.parse('annuelle', value)).toThrow(
        IndicateurPeriodeErrorEnum.INDICATEUR_PERIODE_INVALID
      );
    }
  );

  it('refuse les dates invalides et les écritures hors du premier janvier', () => {
    expect(() =>
      IndicateurPeriodes.fromDateValeur('annuelle', '2026-02-01')
    ).toThrow(IndicateurPeriodeErrorEnum.INDICATEUR_PERIODE_DATE_NON_CANONICAL);
    expect(() =>
      IndicateurPeriodes.containing('annuelle', '2025-02-29')
    ).toThrow(IndicateurPeriodeErrorEnum.INDICATEUR_CALENDAR_DATE_INVALID);
  });

  it.each(['semestrielle', 'trimestrielle', 'mensuelle'] as const)(
    'refuse %s dans toutes les opérations du contrat annuel',
    (periodicite) => {
      const periode = {
        ...IndicateurPeriodes.parse('annuelle', '2026'),
        periodicite,
      } as IndicateurPeriode;
      const operations = [
        () => IndicateurPeriodes.parse(periodicite, '2026'),
        () => IndicateurPeriodes.tryParse(periodicite, '2026'),
        () => IndicateurPeriodes.fromDateValeur(periodicite, '2026-01-01'),
        () => IndicateurPeriodes.containing(periodicite, '2026-01-01'),
        () => IndicateurPeriodes.serialize(periode),
        () => IndicateurPeriodes.toDateValeur(periode),
        () => IndicateurPeriodes.key(periode),
        () => IndicateurPeriodes.format(periode),
        () => IndicateurPeriodes.isFuture(periode),
        () => IndicateurPeriodes.merge([periode]),
      ];

      for (const operation of operations) {
        expect(operation).toThrow(
          IndicateurPeriodeErrorEnum.INDICATEUR_ANNUAL_PERIODICITE_REQUIRED
        );
      }
    }
  );
});
