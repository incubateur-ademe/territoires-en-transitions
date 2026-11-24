import { describe, expect, it } from 'vitest';
import { checkUserIndicateurValeursAllowed } from './user-indicateur-valeur.rules';

describe('checkUserIndicateurValeursAllowed', () => {
  it('accepte des indicateurs qui acceptent une valeur utilisateur', () => {
    const allowance = checkUserIndicateurValeursAllowed([
      { id: 1, sansValeurUtilisateur: false },
      { id: 2, sansValeurUtilisateur: false },
    ]);

    expect(allowance).toEqual({ success: true, data: undefined });
  });

  it('accepte une liste vide', () => {
    const allowance = checkUserIndicateurValeursAllowed([]);

    expect(allowance).toEqual({ success: true, data: undefined });
  });

  it('refuse en citant chaque indicateur protégé, et seulement ceux-là', () => {
    const allowance = checkUserIndicateurValeursAllowed([
      { id: 1, sansValeurUtilisateur: false },
      { id: 2, sansValeurUtilisateur: true },
      { id: 3, sansValeurUtilisateur: true },
    ]);

    expect(allowance).toEqual({
      success: false,
      error: 'USER_VALUE_NOT_ALLOWED',
      cause: new Error(
        "Les indicateurs 2, 3 n'acceptent pas de valeur utilisateur"
      ),
    });
  });
});
