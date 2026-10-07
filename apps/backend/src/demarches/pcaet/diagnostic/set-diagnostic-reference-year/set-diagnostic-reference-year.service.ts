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
    private readonly diagnosticService: DemarchePcaetDiagnosticService
  ) {}

  async setReferenceYear(
    input: SetDiagnosticReferenceYearInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<PcaetDiagnostic, SetDiagnosticReferenceYearError>> {
    const { collectiviteId, demarcheId, indicateurIds, fromYear, toYear } =
      input;

    return this.transactionManager.executeSingle(async (transaction) => {
      const access = await this.accessService.assertWritable(
        { collectiviteId, demarcheId },
        'amont',
        { user, tx: transaction }
      );
      if (!access.success) {
        return failure(SetDiagnosticReferenceYearErrorEnum[access.error]);
      }

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
    }, tx);
  }
}
