import { IndicateurPeriods } from './indicateur-period';
import { normalizeIndicateurReferenceObjectifs } from './indicateur-reference-objectif.rules';

describe('normalizeIndicateurReferenceObjectifs', () => {
  test('positions objectives on chronological annual horizons', () => {
    const objectifs = [
      { dateValeur: '2050-06-30', valeur: 10 },
      { dateValeur: '2030-12-31', valeur: 42 },
    ] as const;

    const normalized = normalizeIndicateurReferenceObjectifs(objectifs);

    expect(
      normalized.map(({ horizon, valeur }) => ({
        dateValeur: IndicateurPeriods.toDateValeur(horizon),
        valeur,
      }))
    ).toEqual([
      { dateValeur: '2030-01-01', valeur: 42 },
      { dateValeur: '2050-01-01', valeur: 10 },
    ]);
  });

  test('keeps the latest dated objective when a year has several imports', () => {
    const normalized = normalizeIndicateurReferenceObjectifs([
      { dateValeur: '2030-12-31', valeur: 42 },
      { dateValeur: '2030-01-01', valeur: 41 },
    ]);

    expect(normalized).toHaveLength(1);
    expect(normalized[0]?.valeur).toBe(42);
  });

  test('rejects an invalid horizon date', () => {
    expect(() =>
      normalizeIndicateurReferenceObjectifs([
        { dateValeur: '2030-02-30', valeur: 42 },
      ])
    ).toThrow('Date calendaire invalide');
  });
});
