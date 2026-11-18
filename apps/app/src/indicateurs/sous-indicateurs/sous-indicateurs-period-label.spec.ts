import { describe, expect, it } from 'vitest';
import { toSousIndicateurPeriodLabel } from './sous-indicateurs-period-label';

describe('toSousIndicateurPeriodLabel', () => {
  it("affiche l'année pour un indicateur annuel", () => {
    expect(
      toSousIndicateurPeriodLabel({
        periodicite: 'annuelle',
        dateValeur: '2022-01-01',
      })
    ).toBe('2022');
  });

  it('distingue deux mois de la même année pour un indicateur mensuel', () => {
    const labels = ['2022-01-01', '2022-02-01'].map((dateValeur) =>
      toSousIndicateurPeriodLabel({ periodicite: 'mensuelle', dateValeur })
    );

    expect(new Set(labels).size).toBe(2);
  });

  it('accepte une date avec heure', () => {
    expect(
      toSousIndicateurPeriodLabel({
        periodicite: 'annuelle',
        dateValeur: '2022-01-01T00:00:00.000Z',
      })
    ).toBe('2022');
  });
});
