import { shouldConfirmValueDeletion } from './indicateur-valeur-deletion.rules';

describe('shouldConfirmValueDeletion', () => {
  it.each([
    { resultat: 0 },
    { objectif: 0 },
    { resultat: 12 },
    { resultatCommentaire: 'Relevé annuel' },
    { objectifCommentaire: 'Objectif annuel' },
  ])(
    'demande confirmation avant de supprimer une observation renseignée : %j',
    (valeur) => {
      expect(shouldConfirmValueDeletion(valeur)).toBe(true);
    }
  );

  it('supprime directement une observation entièrement vide', () => {
    expect(
      shouldConfirmValueDeletion({
        resultat: null,
        objectif: null,
        resultatCommentaire: '',
        objectifCommentaire: null,
      })
    ).toBe(false);
  });
});
