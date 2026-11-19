import { IndicateurPeriodes } from '@tet/domain/indicateurs';
import { describe, expect, it } from 'vitest';
import {
  countCommentaires,
  toCommentairesByPeriodeKey,
} from './sous-indicateurs-commentaires.rules';

const PERIODE_2022 = IndicateurPeriodes.fromYear(2022);

describe('toCommentairesByPeriodeKey', () => {
  it("indexe les commentaires du résultat et de l'objectif par période", () => {
    const commentaires = toCommentairesByPeriodeKey([
      {
        dateValeur: '2022-01-01',
        periodicite: 'annuelle',
        resultatCommentaire: 'Mesuré en mars',
        objectifCommentaire: null,
      },
    ]);

    expect(commentaires.get(IndicateurPeriodes.key(PERIODE_2022))).toEqual({
      resultat: 'Mesuré en mars',
      objectif: '',
    });
  });

  it('range une date qui tombe dans une période sous la clé de cette période', () => {
    const commentaires = toCommentairesByPeriodeKey([
      {
        dateValeur: '2022-06-15',
        periodicite: 'annuelle',
        resultatCommentaire: 'En cours d’année',
      },
    ]);

    expect(commentaires.has(IndicateurPeriodes.key(PERIODE_2022))).toBe(true);
  });
});

describe('countCommentaires', () => {
  it.each([
    [{ resultat: '', objectif: '' }, 0],
    [{ resultat: 'a', objectif: '' }, 1],
    [{ resultat: 'a', objectif: 'b' }, 2],
  ])('compte les commentaires renseignés de %o', (commentaires, expected) => {
    expect(countCommentaires(commentaires)).toBe(expected);
  });
});
