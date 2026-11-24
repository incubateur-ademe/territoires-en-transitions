import { BadRequestException } from '@nestjs/common';
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

/**
 * Compatibility error for legacy value-write entry points that still expose
 * Nest exceptions instead of the Result contract.
 */
export class UserIndicateurValeurNotAllowedException extends BadRequestException {
  constructor(indicateurIds: number[]) {
    super(getUserIndicateurValeurNotAllowedMessage(indicateurIds));
  }
}
