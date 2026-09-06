import { describe, expect, it } from 'vitest';
import {
  assertAnnualScoreIndicateurs,
  getAnnualScoreIndicatifPeriodicite,
} from './score-indicatif-periodicite.rules';

describe('assertAnnualScoreIndicateurs', () => {
  it('accepte une formule dont tous les indicateurs sont annuels', () => {
    expect(() =>
      assertAnnualScoreIndicateurs([
        {
          indicateurId: 1,
          identifiantReferentiel: 'cae_1.a',
          periodicite: 'annuelle',
        },
        {
          indicateurId: 2,
          identifiantReferentiel: 'cae_1.b',
          periodicite: 'annuelle',
        },
      ])
    ).not.toThrow();
  });

  it('refuse un indicateur mensuel', () => {
    expect(() =>
      assertAnnualScoreIndicateurs([
        {
          indicateurId: 1,
          identifiantReferentiel: 'mensuel',
          periodicite: 'mensuelle',
        },
      ])
    ).toThrow(/score indicatif.*mensuel.*annuelle/i);
  });

  it('refuse une formule mixte même si son premier indicateur est annuel', () => {
    expect(() =>
      assertAnnualScoreIndicateurs([
        {
          indicateurId: 1,
          identifiantReferentiel: 'annuel',
          periodicite: 'annuelle',
        },
        {
          indicateurId: 2,
          identifiantReferentiel: 'mensuel',
          periodicite: 'mensuelle',
        },
      ])
    ).toThrow(/score indicatif.*mensuel.*annuelle/i);
  });

  it('retourne la cadence annuelle validée pour le transport', () => {
    expect(
      getAnnualScoreIndicatifPeriodicite([
        { indicateurId: 1, periodicite: 'annuelle' },
      ])
    ).toBe('annuelle');
    expect(() => getAnnualScoreIndicatifPeriodicite([])).toThrow(
      /au moins un indicateur/i
    );
  });
});
