import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  isDemarchePcaetEtapeModifiable,
  type DemarchePcaetEtapeDossier,
} from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import {
  DemarchePcaetRefRepository,
  type DemarchePcaetRef,
} from './demarche-pcaet-ref.repository';

/**
 * Erreurs du préambule d'écriture. Chaque slice les reprend dans son propre
 * enum : le contrat d'erreur reste lisible route par route.
 */
export const demarchePcaetAccessErrors = [
  'DEMARCHE_PCAET_NOT_FOUND',
  'DEMARCHE_PCAET_NON_MODIFIABLE',
] as const;

export type DemarchePcaetAccessError =
  | 'UNAUTHORIZED'
  | (typeof demarchePcaetAccessErrors)[number];

/**
 * Préambule de toute mutation du contenu d'une démarche : droit d'édition sur
 * la collectivité, démarche lui appartenant bien (parade IDOR), et temps du
 * dossier visé encore modifiable. L'écrire une fois évite que les routes ne
 * divergent.
 *
 * **Dans la transaction, et sous verrou de ligne** : c'est ce qui distingue ce
 * service d'un middleware tRPC. Sans le verrou, une saisie peut être acceptée
 * pendant que la transmission fige la photo du dossier, et devenir invisible
 * aussitôt après puisque l'écran sert alors le snapshot. La règle doit donc être
 * vérifiée là où l'écriture a lieu, pas avant d'y entrer.
 */
@Injectable()
export class DemarchePcaetAccessService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly refRepository: DemarchePcaetRefRepository
  ) {}

  async assertWritable(
    {
      collectiviteId,
      demarcheId,
    }: { collectiviteId: number; demarcheId: number },
    etape: DemarchePcaetEtapeDossier,
    { user, tx }: { user: AuthenticatedUser; tx: Transaction }
  ): Promise<Result<DemarchePcaetRef, DemarchePcaetAccessError>> {
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
    if (!isDemarchePcaetEtapeModifiable(ref.status, etape)) {
      return failure('DEMARCHE_PCAET_NON_MODIFIABLE');
    }

    return success(ref);
  }
}
