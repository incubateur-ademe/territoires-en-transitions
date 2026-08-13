import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { isDemarchePcaetDiagnosticMutable } from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import {
  DemarchePcaetRefRepository,
  type DemarchePcaetRef,
} from './demarche-pcaet-ref.repository';

/**
 * Erreurs communes aux mutations de la vulnérabilité. Chaque slice les reprend
 * dans son propre enum : le contrat d'erreur reste lisible route par route.
 */
export const vulnerabiliteAccessErrors = [
  'DEMARCHE_PCAET_NOT_FOUND',
  'DIAGNOSTIC_NON_MODIFIABLE',
] as const;

export type VulnerabiliteAccessError =
  | 'UNAUTHORIZED'
  | (typeof vulnerabiliteAccessErrors)[number];

/**
 * Préambule des quatre mutations du volet vulnérabilité : droit d'édition sur
 * la collectivité, démarche lui appartenant bien (parade IDOR), et dépôt encore
 * en élaboration. L'écrire une fois évite que les quatre routes ne divergent.
 *
 * Le verrou de ligne sur `demarche` est essentiel : sans lui, une saisie peut
 * être acceptée pendant que la transmission fige sa photo, et devenir
 * invisible aussitôt après puisque l'écran sert alors le snapshot.
 */
@Injectable()
export class DemarchePcaetVulnerabiliteAccessService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly refRepository: DemarchePcaetRefRepository
  ) {}

  async assertMutable(
    {
      collectiviteId,
      demarcheId,
    }: { collectiviteId: number; demarcheId: number },
    { user, tx }: { user: AuthenticatedUser; tx: Transaction }
  ): Promise<Result<DemarchePcaetRef, VulnerabiliteAccessError>> {
    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['DEMARCHES.PCAET.MUTATE'],
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );
    if (!permissionResult.success) {
      return failure('UNAUTHORIZED');
    }

    const ref = await this.refRepository.findRef(
      { demarcheId, collectiviteId },
      { forUpdate: true },
      tx
    );
    if (!ref) {
      return failure('DEMARCHE_PCAET_NOT_FOUND');
    }
    if (!isDemarchePcaetDiagnosticMutable(ref.status)) {
      return failure('DIAGNOSTIC_NON_MODIFIABLE');
    }

    return success(ref);
  }
}
