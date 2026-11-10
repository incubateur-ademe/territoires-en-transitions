import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import type { PcaetDiagnostic } from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { DemarchePcaetAccessService } from '../../shared/demarche-pcaet-access.service';
import { DemarchePcaetDiagnosticService } from '../../shared/demarche-pcaet-diagnostic.service';
import { DemarchePcaetSourceMetadonneeRepository } from '../../shared/demarche-pcaet-source-metadonnee.repository';
import {
  SetDiagnosticReferenceYearErrorEnum,
  type SetDiagnosticReferenceYearError,
} from './set-diagnostic-reference-year.errors';
import type { SetDiagnosticReferenceYearInput } from './set-diagnostic-reference-year.input';
import { SetDiagnosticReferenceYearRepository } from './set-diagnostic-reference-year.repository';
import {
  DemarchePcaetActeurEnum,
  DemarchePcaetEventEnum,
} from '../../shared/tracking/demarche-pcaet-tracking.constants';
import type { DemarchePcaetRef } from '../../shared/demarche-pcaet-ref.repository';
import { DemarchePcaetTrackingService } from '../../shared/tracking/demarche-pcaet-tracking.service';

/**
 * L'année de référence n'est pas stockée : elle se déduit des années des
 * résultats saisis. En changer revient donc à déplacer les valeurs du tableau
 * d'une année sur l'autre — et sans valeur à déplacer, il n'y a rien à
 * persister, le front garde alors la colonne qu'il affiche.
 */
@Injectable()
export class SetDiagnosticReferenceYearService {
  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly permissionService: PermissionService,
    private readonly accessService: DemarchePcaetAccessService,
    private readonly sourceMetadonneeRepository: DemarchePcaetSourceMetadonneeRepository,
    private readonly repository: SetDiagnosticReferenceYearRepository,
    private readonly diagnosticService: DemarchePcaetDiagnosticService,
    private readonly trackingService: DemarchePcaetTrackingService
  ) {}

  async setReferenceYear(
    input: SetDiagnosticReferenceYearInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<PcaetDiagnostic, SetDiagnosticReferenceYearError>> {
    let demarche: DemarchePcaetRef | undefined;
    const { collectiviteId, demarcheId, indicateurIds, fromYear, toYear } =
      input;

    const result = await this.transactionManager.executeSingle(
      async (transaction) => {
        const access = await this.accessService.assertWritable(
          { collectiviteId, demarcheId },
          'contenu',
          { user, tx: transaction }
        );
        if (!access.success) {
          return failure(SetDiagnosticReferenceYearErrorEnum[access.error]);
        }
        demarche = access.data;

        const valeursPermission = await this.permissionService.isAllowed(
          user,
          PermissionOperationEnum['INDICATEURS.VALEURS.MUTATE'],
          ResourceType.COLLECTIVITE,
          { collectiviteId },
          transaction
        );
        if (!valeursPermission.success) {
          return failure(SetDiagnosticReferenceYearErrorEnum.UNAUTHORIZED);
        }

        const metadonneeId =
          await this.sourceMetadonneeRepository.findMetadonneeId(
            { demarcheId, collectiviteId },
            transaction
          );

        if (fromYear !== null && fromYear !== toYear && metadonneeId !== null) {
          await this.repository.moveValeursToYear(
            {
              collectiviteId,
              metadonneeId,
              indicateurIds,
              fromYear,
              toYear,
              userId: user.id,
            },
            transaction
          );
        }

        const payload = await this.diagnosticService.loadPayload(
          { demarcheId, collectiviteId },
          transaction
        );
        return success(payload);
      },
      tx
    );
    if (result.success && demarche) {
      this.trackingService.track(
        DemarchePcaetEventEnum.DIAGNOSTIC_ANNEE_REFERENCE_DEFINIE,
        demarche,
        {
          userId: user.id,
          acteur: DemarchePcaetActeurEnum.COLLECTIVITE,
          properties: {
            annee: toYear,
            changement: fromYear !== null && fromYear !== toYear,
            nbIndicateurs: indicateurIds.length,
          },
        }
      );
    }
    return result;
  }
}
