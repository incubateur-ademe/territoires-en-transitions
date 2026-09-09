import { describe, expect, it } from 'vitest';
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
    ).toThrow(/test annuel.*annuelle.*mensuelle/i);
  });

  it('refuse une définition dont la périodicité est absente', () => {
    expect(() =>
      assertAnnualIndicateurPeriodicite(null, 'test annuel')
    ).toThrow(/absente/i);
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
    ).toThrow(/canonique/i);
  });

  it('refuse une cadence mensuelle même à la frontière historique', () => {
    expect(() =>
      toAnnualIndicateurYearFromHistoricalDate(
        'mensuelle',
        '2025-01-01',
        'Un ancien snapshot'
      )
    ).toThrow(/mensuelle/);
  });
});
