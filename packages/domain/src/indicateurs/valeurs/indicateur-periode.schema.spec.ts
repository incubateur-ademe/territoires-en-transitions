import { describe, expect, it } from 'vitest';
import {
  IndicateurPeriodes,
  IndicateurPeriodiciteEnum,
  IndicateurPeriodeErrorEnum,
  indicateurPeriodeSchema,
} from '..';

describe('Validation JSON des périodes', () => {
  it.each([
    IndicateurPeriodiciteEnum.MENSUELLE,
    IndicateurPeriodiciteEnum.TRIMESTRIELLE,
    IndicateurPeriodiciteEnum.SEMESTRIELLE,
  ])('accepte la périodicité %s', (periodicite) => {
    expect(
      indicateurPeriodeSchema.safeParse({
        periodicite,
        dateDebut: '2026-01-01',
      }).success
    ).toBe(true);
  });

  it('valide et réhydrate la représentation JSON', () => {
    const result = indicateurPeriodeSchema.safeParse({
      periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
      dateDebut: '2026-01-01',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(
        IndicateurPeriodes.parse(IndicateurPeriodiciteEnum.ANNUELLE, '2026')
      );
      expect(Object.isFrozen(result.data)).toBe(true);
    }
    const invalid = indicateurPeriodeSchema.safeParse({
      periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
      dateDebut: '2026-02-01',
    });
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.error.issues).toEqual([
        expect.objectContaining({
          code: 'custom',
          params: {
            code: IndicateurPeriodeErrorEnum.INDICATEUR_PERIODE_DATE_NON_CANONICAL,
            details: {
              periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
              dateValeur: '2026-02-01',
            },
          },
        }),
      ]);
    }
  });
});
