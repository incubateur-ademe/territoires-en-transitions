import { describe, expect, it } from 'vitest';
import { IndicateurPeriodErrorEnum } from './indicateur-period.errors';
import {
  assertAnnualIndicateurPeriodicite,
  toAnnualIndicateurYear,
  toAnnualIndicateurYearFromHistoricalDate,
} from './annual-indicateur-period.adapter';

describe('adaptateur des capacités annuelles historiques', () => {
  it('extrait une année depuis une date annuelle canonique', () => {
    expect(
      toAnnualIndicateurYear('annuelle', '2026-01-01', 'test annuel')
    ).toBe(2026);
  });

  it('refuse même janvier quand la définition est mensuelle', () => {
    expect(() =>
      toAnnualIndicateurYear('mensuelle', '2026-01-01', 'test annuel')
    ).toThrow(
      expect.objectContaining({
        code: IndicateurPeriodErrorEnum.INDICATEUR_ANNUAL_PERIODICITE_REQUIRED,
        details: { periodicite: 'mensuelle', capability: 'test annuel' },
      })
    );
  });

  it('refuse une définition dont la périodicité est absente', () => {
    expect(() =>
      assertAnnualIndicateurPeriodicite(null, 'test annuel')
    ).toThrow(
      expect.objectContaining({
        code: IndicateurPeriodErrorEnum.INDICATEUR_ANNUAL_PERIODICITE_REQUIRED,
        details: { periodicite: null, capability: 'test annuel' },
      })
    );
  });

  it('classe une ancienne date annuelle non canonique sans assouplir le contrat courant', () => {
    expect(
      toAnnualIndicateurYearFromHistoricalDate(
        'annuelle',
        '2025-07-10',
        'Un ancien snapshot'
      )
    ).toBe(2025);
    expect(() =>
      toAnnualIndicateurYear('annuelle', '2025-07-10', 'Une valeur courante')
    ).toThrow(IndicateurPeriodErrorEnum.INDICATEUR_PERIOD_DATE_NON_CANONICAL);
  });

  it('refuse une cadence mensuelle même à la frontière historique', () => {
    expect(() =>
      toAnnualIndicateurYearFromHistoricalDate(
        'mensuelle',
        '2025-01-01',
        'Un ancien snapshot'
      )
    ).toThrow(
      expect.objectContaining({
        code: IndicateurPeriodErrorEnum.INDICATEUR_ANNUAL_PERIODICITE_REQUIRED,
        details: { periodicite: 'mensuelle', capability: 'Un ancien snapshot' },
      })
    );
  });
});
