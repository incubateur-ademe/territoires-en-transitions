import { describe, expect, it } from 'vitest';
import type {
  ScoreIndicatifAction,
  ScoreIndicatifValeurUtilisee,
} from './score-indicatif.types';
import { prepareScoreIndicatifData, texteValeurUtilisee } from './utils';

const valeurUtilisee = {
  indicateurId: 7,
  valeur: 12,
  dateValeur: '2026-01-01',
  sourceLibelle: 'CITEPA',
  sourceMetadonnee: null,
} as ScoreIndicatifValeurUtilisee;

describe('score indicatif annuel', () => {
  it('conserve la périodicité de la définition avec la valeur préparée', () => {
    const scoreIndicatif = {
      indicateurs: [
        {
          indicateurId: 7,
          titre: 'Émissions',
          periodicite: 'annuelle',
        },
      ],
      fait: { score: 0.5, valeursUtilisees: [valeurUtilisee] },
    } as unknown as ScoreIndicatifAction;

    expect(prepareScoreIndicatifData('fait', scoreIndicatif)).toMatchObject({
      valeurPrincipale: {
        indicateurTitre: 'Émissions',
        periodicite: 'annuelle',
      },
    });
  });

  it('formate une valeur annuelle canonique', () => {
    expect(
      texteValeurUtilisee({
        valeurUtilisee,
        periodicite: 'annuelle',
        typeScore: 'fait',
        unite: 'tCO2e',
      })
    ).toEqual({
      valeurEtUnite: '12 tCO2e',
      annee: 'en 2026',
      source: ' (source : CITEPA)',
    });
  });

  it('échoue fermé quand cette capacité annuelle reçoit une valeur mensuelle', () => {
    expect(() =>
      texteValeurUtilisee({
        valeurUtilisee,
        periodicite: 'mensuelle',
        typeScore: 'fait',
        unite: 'tCO2e',
      })
    ).toThrow(/score indicatif.*annuelle.*mensuelle/i);
  });
});
