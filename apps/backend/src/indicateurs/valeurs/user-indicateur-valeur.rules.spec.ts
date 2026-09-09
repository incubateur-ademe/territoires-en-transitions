import { UserIndicateurValeurNotAllowedException } from './user-indicateur-valeur.errors';
import { assertUserIndicateurValeursAllowed } from './user-indicateur-valeur.rules';

describe('assertUserIndicateurValeursAllowed', () => {
  test('accepte les indicateurs ouverts à la saisie utilisateur', () => {
    expect(() =>
      assertUserIndicateurValeursAllowed([
        { id: 1, sansValeurUtilisateur: false },
        { id: 2, sansValeurUtilisateur: false },
      ])
    ).not.toThrow();
  });

  test('refuse tous les indicateurs protégés dans une seule erreur', () => {
    expect(() =>
      assertUserIndicateurValeursAllowed([
        { id: 1, sansValeurUtilisateur: true },
        { id: 2, sansValeurUtilisateur: false },
        { id: 3, sansValeurUtilisateur: true },
      ])
    ).toThrow(new UserIndicateurValeurNotAllowedException([1, 3]).message);
  });
});
