import { describe, expect, it } from 'vitest';
import { shouldConfirmValueDeletion } from './indicateur-valeur-deletion.rules';

describe('shouldConfirmValueDeletion', () => {
  it('demande confirmation pour une valeur nulle au sens numérique', () => {
    expect(
      shouldConfirmValueDeletion({
        objectif: null,
        resultat: 0,
        objectifCommentaire: null,
        resultatCommentaire: null,
      })
    ).toBe(true);
  });

  it('supprime directement une ligne réellement vide', () => {
    expect(
      shouldConfirmValueDeletion({
        objectif: null,
        resultat: null,
        objectifCommentaire: null,
        resultatCommentaire: null,
      })
    ).toBe(false);
  });
});
