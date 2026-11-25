import { failure, Result } from '@tet/backend/utils/result.type';

const getUserIndicateurValeurNotAllowedMessage = (
  indicateurIds: number[]
): string =>
  `Les indicateurs ${indicateurIds.join(
    ', '
  )} n'acceptent pas de valeur utilisateur`;

export const toUserValeurNotAllowedFailure = (
  indicateurIds: number[]
): Result<never, 'USER_VALUE_NOT_ALLOWED'> =>
  failure(
    'USER_VALUE_NOT_ALLOWED',
    new Error(getUserIndicateurValeurNotAllowedMessage(indicateurIds))
  );
