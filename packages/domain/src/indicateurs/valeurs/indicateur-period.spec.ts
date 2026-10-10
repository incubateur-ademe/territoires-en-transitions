import { describe, expect, it } from 'vitest';
import {
  IndicateurPeriods,
  IndicateurPeriodErrorEnum,
  type IndicateurPeriod,
} from '..';

describe('IndicateurPeriods — contrat annuel', () => {
  it.each(['0001', '2026', '9999'])(
    'conserve la période annuelle %s et sa date canonique',
    (year) => {
      const period = IndicateurPeriods.parse('annuelle', year);

      expect(period).toEqual({
        periodicite: 'annuelle',
        dateDebut: `${year}-01-01`,
      });
      expect(Object.isFrozen(period)).toBe(true);
      expect(IndicateurPeriods.serialize(period)).toBe(year);
      expect(IndicateurPeriods.toDateValeur(period)).toBe(`${year}-01-01`);
      expect(IndicateurPeriods.key(period)).toBe(`annuelle:${year}`);
      expect(
        IndicateurPeriods.fromDateValeur('annuelle', `${year}-01-01`)
      ).toEqual(period);
    }
  );

  it('retrouve l’année des dates historiques, y compris un 29 février', () => {
    expect(IndicateurPeriods.containing('annuelle', '2024-02-29')).toEqual(
      IndicateurPeriods.parse('annuelle', '2024')
    );
    expect(IndicateurPeriods.containing('annuelle', '2026-12-31')).toEqual(
      IndicateurPeriods.parse('annuelle', '2026')
    );
  });

  it.each(['0000', '26', '2026-01', '2026-T1', '10000'])(
    'refuse la période annuelle invalide %s',
    (value) => {
      expect(() => IndicateurPeriods.parse('annuelle', value)).toThrow(
        IndicateurPeriodErrorEnum.INDICATEUR_PERIOD_INVALID
      );
    }
  );

  it('refuse les dates invalides et les écritures hors du premier janvier', () => {
    expect(() =>
      IndicateurPeriods.fromDateValeur('annuelle', '2026-02-01')
    ).toThrow(IndicateurPeriodErrorEnum.INDICATEUR_PERIOD_DATE_NON_CANONICAL);
    expect(() =>
      IndicateurPeriods.containing('annuelle', '2025-02-29')
    ).toThrow(IndicateurPeriodErrorEnum.INDICATEUR_CALENDAR_DATE_INVALID);
  });

  it.each(['semestrielle', 'trimestrielle', 'mensuelle'] as const)(
    'refuse %s dans toutes les opérations du contrat annuel',
    (periodicite) => {
      const period = {
        ...IndicateurPeriods.parse('annuelle', '2026'),
        periodicite,
      } as IndicateurPeriod;
      const operations = [
        () => IndicateurPeriods.parse(periodicite, '2026'),
        () => IndicateurPeriods.fromDateValeur(periodicite, '2026-01-01'),
        () => IndicateurPeriods.containing(periodicite, '2026-01-01'),
        () => IndicateurPeriods.serialize(period),
        () => IndicateurPeriods.toDateValeur(period),
        () => IndicateurPeriods.key(period),
      ];

      for (const operation of operations) {
        expect(operation).toThrow(
          IndicateurPeriodErrorEnum.INDICATEUR_ANNUAL_PERIODICITE_REQUIRED
        );
      }
    }
  );
});
