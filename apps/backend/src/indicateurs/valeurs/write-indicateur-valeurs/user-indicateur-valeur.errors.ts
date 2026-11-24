import { BadRequestException } from '@nestjs/common';
import { getUserIndicateurValeurNotAllowedMessage } from './user-indicateur-valeur.rules';

/**
 * Compatibility error for legacy value-write entry points that still expose
 * Nest exceptions instead of the Result contract.
 */
export class UserIndicateurValeurNotAllowedException extends BadRequestException {
  constructor(indicateurIds: number[]) {
    super(getUserIndicateurValeurNotAllowedMessage(indicateurIds));
  }
}
