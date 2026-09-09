import { describe, expect, it } from 'vitest';
import { indicateurPeriodiciteValues } from '../definitions/indicateur-periodicite.schema';
import {
  isIndicateurDisplayPeriodiciteAllowed,
  listIndicateurDisplayPeriodicites,
  resolveIndicateurDisplayPeriodicite,
} from './indicateur-display-periodicite.rules';

describe('périodicité de déclaration et affichage du graphique', () => {
  it.each(indicateurPeriodiciteValues)(
    'affiche par défaut à la cadence de déclaration %s',
    (periodicite) => {
      expect(resolveIndicateurDisplayPeriodicite(periodicite)).toBe(
        periodicite
      );
      expect(listIndicateurDisplayPeriodicites(periodicite)).toContain(
        periodicite
      );
    }
  );

  it('autorise les repères annuels pour des observations mensuelles', () => {
    expect(listIndicateurDisplayPeriodicites('mensuelle')).toEqual([
      'mensuelle',
      'annuelle',
    ]);
    expect(resolveIndicateurDisplayPeriodicite('mensuelle', 'annuelle')).toBe(
      'annuelle'
    );
  });

  it('refuse de présenter une déclaration annuelle à une cadence mensuelle', () => {
    expect(listIndicateurDisplayPeriodicites('annuelle')).toEqual(['annuelle']);
    expect(isIndicateurDisplayPeriodiciteAllowed('annuelle', 'mensuelle')).toBe(
      false
    );
    expect(() =>
      resolveIndicateurDisplayPeriodicite('annuelle', 'mensuelle')
    ).toThrow(/affichage.*déclaration/);
  });
});
