import { describe, expect, it } from 'vitest';
import { indicateurPeriodiciteValues } from '../definitions/indicateur-periodicite.schema';
import { IndicateurPeriodErrorEnum } from './indicateur-period.errors';
import {
  isIndicateurDisplayPeriodiciteAllowed,
  listIndicateurDisplayPeriodicites,
  resolveIndicateurDisplayPeriodicite,
  resolveIndicateurSourceDisplayPeriodicite,
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

  it('autorise les regroupements calendaires pour des observations mensuelles', () => {
    expect(listIndicateurDisplayPeriodicites('mensuelle')).toEqual([
      'mensuelle',
      'trimestrielle',
      'semestrielle',
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
    ).toThrow(
      expect.objectContaining({
        code: IndicateurPeriodErrorEnum.INDICATEUR_DISPLAY_PERIODICITE_INVALID,
        details: { declaration: 'annuelle', display: 'mensuelle' },
      })
    );
  });
  it('suit la déclaration par défaut sans inventer des observations plus fines', () => {
    expect(
      resolveIndicateurSourceDisplayPeriodicite('annuelle', ['mensuelle'])
    ).toBe('annuelle');
    expect(
      resolveIndicateurSourceDisplayPeriodicite('mensuelle', ['annuelle'])
    ).toBe('annuelle');
    expect(
      resolveIndicateurSourceDisplayPeriodicite(
        'annuelle',
        ['mensuelle'],
        'trimestrielle'
      )
    ).toBe('trimestrielle');
    expect(() =>
      resolveIndicateurSourceDisplayPeriodicite(
        'mensuelle',
        ['annuelle'],
        'mensuelle'
      )
    ).toThrow();
  });
});
