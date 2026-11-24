import { failure, Result, success } from '@tet/backend/utils/result.type';
import type { Indicateur } from '@tet/domain/indicateurs';

export const getUserIndicateurValeurNotAllowedMessage = (
  indicateurIds: number[]
): string =>
  `Les indicateurs ${indicateurIds.join(
    ', '
  )} n'acceptent pas de valeur utilisateur`;

/** Politique unique protégeant les indicateurs alimentés exclusivement par calcul/source. */
export const checkUserIndicateurValeursAllowed = (
  indicateurs: Pick<Indicateur, 'id' | 'sansValeurUtilisateur'>[]
): Result<void, 'USER_VALUE_NOT_ALLOWED'> => {
  const protectedIndicateurIds = indicateurs
    .filter(({ sansValeurUtilisateur }) => sansValeurUtilisateur)
    .map(({ id }) => id);
  if (protectedIndicateurIds.length > 0) {
    return failure(
      'USER_VALUE_NOT_ALLOWED',
      new Error(
        getUserIndicateurValeurNotAllowedMessage(protectedIndicateurIds)
      )
    );
  }
  return success(undefined);
};
