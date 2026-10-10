import type { IndicateurDefinition } from '@tet/domain/indicateurs';
import { UserIndicateurValeurNotAllowedException } from './user-indicateur-valeur.errors';

/** Politique unique protégeant les indicateurs alimentés exclusivement par calcul/source. */
export const assertUserIndicateurValeursAllowed = (
  indicateurs: Pick<IndicateurDefinition, 'id' | 'sansValeurUtilisateur'>[]
): void => {
  const protectedIndicateurIds = indicateurs
    .filter(({ sansValeurUtilisateur }) => sansValeurUtilisateur)
    .map(({ id }) => id);
  if (protectedIndicateurIds.length > 0) {
    throw new UserIndicateurValeurNotAllowedException(protectedIndicateurIds);
  }
};
