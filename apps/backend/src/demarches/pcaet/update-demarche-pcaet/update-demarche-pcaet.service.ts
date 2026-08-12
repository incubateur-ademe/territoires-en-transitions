import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result } from '@tet/backend/utils/result.type';
import {
  isEditableDemarchePcaetStatus,
  type DemarchePcaet,
} from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { GetDemarchePcaetRepository } from '../get-demarche-pcaet/get-demarche-pcaet.repository';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
import { DemarchePcaetDiagnosticService } from '../shared/demarche-pcaet-diagnostic.service';
import { DemarchePcaetGuardsService } from '../shared/demarche-pcaet-guards.service';
import { DemarchePcaetPilotesRepository } from '../shared/demarche-pcaet-pilotes.repository';
import { DemarchePcaetRefRepository } from '../shared/demarche-pcaet-ref.repository';
import {
  UpdateDemarchePcaetError,
  UpdateDemarchePcaetErrorEnum,
} from './update-demarche-pcaet.errors';
import { UpdateDemarchePcaetInput } from './update-demarche-pcaet.input';
import { UpdateDemarchePcaetRepository } from './update-demarche-pcaet.repository';

@Injectable()
export class UpdateDemarchePcaetService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly transactionManager: TransactionManager,
    private readonly demarchePcaetRefRepository: DemarchePcaetRefRepository,
    private readonly updateDemarchePcaetRepository: UpdateDemarchePcaetRepository,
    private readonly pilotesRepository: DemarchePcaetPilotesRepository,
    private readonly getDemarchePcaetRepository: GetDemarchePcaetRepository,
    private readonly guardsService: DemarchePcaetGuardsService,
    private readonly diagnosticService: DemarchePcaetDiagnosticService,
    private readonly documentsRepository: DemarcheDocumentsRepository
  ) {}

  async updateDemarchePcaet(
    input: UpdateDemarchePcaetInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaet, UpdateDemarchePcaetError>> {
    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<Result<DemarchePcaet, UpdateDemarchePcaetError>> => {
      const demarche = await this.demarchePcaetRefRepository.findRef(
        input,
        undefined,
        transaction
      );
      if (!demarche) {
        return failure(UpdateDemarchePcaetErrorEnum.DEMARCHE_PCAET_NOT_FOUND);
      }

      // Permission vérifiée sur le collectiviteId stocké (règle IDOR).
      const permissionResult = await this.permissionService.isAllowed(
        user,
        PermissionOperationEnum['DEMARCHES.PCAET.MUTATE'],
        ResourceType.COLLECTIVITE,
        { collectiviteId: demarche.collectiviteId },
        transaction
      );
      if (!permissionResult.success) {
        return failure(UpdateDemarchePcaetErrorEnum.UNAUTHORIZED);
      }

      // Règle métier appliquée côté serveur : le header n'est modifiable que
      // pendant l'élaboration.
      if (!isEditableDemarchePcaetStatus(demarche.status)) {
        return failure(UpdateDemarchePcaetErrorEnum.DEMARCHE_NON_MODIFIABLE);
      }

      if (
        typeof input.planActionId === 'number' &&
        !(await this.updateDemarchePcaetRepository.isPlanActionOfCollectivite(
          input.planActionId,
          demarche.collectiviteId,
          transaction
        ))
      ) {
        return failure(UpdateDemarchePcaetErrorEnum.INVALID_PLAN_ACTION);
      }

      const updateResult =
        await this.updateDemarchePcaetRepository.updateHeader(
          demarche,
          input,
          user.id,
          transaction
        );
      if (!updateResult.success) {
        return failure(
          UpdateDemarchePcaetErrorEnum.UPDATE_DEMARCHE_PCAET_ERROR
        );
      }

      if (input.pilotes !== undefined) {
        const pilotesResult = await this.pilotesRepository.setPilotes(
          demarche.id,
          input.pilotes,
          user.id,
          transaction
        );
        if (!pilotesResult.success) {
          return failure(UpdateDemarchePcaetErrorEnum.SET_PILOTES_ERROR);
        }
      }

      const getResult = await this.getDemarchePcaetRepository.getDemarchePcaet(
        { demarcheId: demarche.id, collectiviteId: demarche.collectiviteId },
        transaction
      );
      if (!getResult.success) {
        return failure(
          UpdateDemarchePcaetErrorEnum.UPDATE_DEMARCHE_PCAET_ERROR
        );
      }
      return {
        success: true,
        data: this.guardsService.enrich(getResult.data, user, {
          documentsComplets: await this.documentsRepository.isDocumentsComplet(
            getResult.data,
            transaction
          ),
          diagnosticComplet: await this.diagnosticService.isDiagnosticComplet(
            { demarcheId: getResult.data.id, collectiviteId: getResult.data.collectiviteId },
            transaction
          ),
        }),
      };
    };

    return this.transactionManager.executeSingle(executeInTransaction, tx);
  }
}
