import { describe, expect, it } from 'vitest';
import { getIndicateurIdsWithoutUserValeur } from './user-indicateur-valeur.rules';

describe('getIndicateurIdsWithoutUserValeur', () => {
  it('ne retourne aucun identifiant quand tous les indicateurs acceptent une valeur utilisateur', () => {
    const protectedIds = getIndicateurIdsWithoutUserValeur([
      { id: 1, sansValeurUtilisateur: false },
      { id: 2, sansValeurUtilisateur: false },
    ]);

    expect(protectedIds).toEqual([]);
  });

  it('retourne chaque indicateur protégé, et seulement ceux-là', () => {
    const protectedIds = getIndicateurIdsWithoutUserValeur([
      { id: 1, sansValeurUtilisateur: false },
      { id: 2, sansValeurUtilisateur: true },
      { id: 3, sansValeurUtilisateur: true },
    ]);

    expect(protectedIds).toEqual([2, 3]);
  });
});
