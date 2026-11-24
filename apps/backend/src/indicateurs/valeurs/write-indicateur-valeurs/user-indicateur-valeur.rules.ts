import type { Indicateur } from '@tet/domain/indicateurs';

/** Politique unique protégeant les indicateurs alimentés exclusivement par calcul/source. */
export const getIndicateurIdsWithoutUserValeur = (
  indicateurs: Pick<Indicateur, 'id' | 'sansValeurUtilisateur'>[]
): number[] =>
  indicateurs
    .filter(({ sansValeurUtilisateur }) => sansValeurUtilisateur)
    .map(({ id }) => id);
