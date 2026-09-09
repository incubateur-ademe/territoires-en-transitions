import { BadRequestException } from '@nestjs/common';

/**
 * Compatibility error for legacy value-write entry points that still expose
 * Nest exceptions instead of the Result contract.
 */
export class UserIndicateurValeurNotAllowedException extends BadRequestException {
  constructor(indicateurIds: number[]) {
    super(
      `Les indicateurs ${indicateurIds.join(
        ', '
      )} n'acceptent pas de valeur utilisateur`
    );
  }
}
