import { Injectable } from '@nestjs/common';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result } from '@tet/backend/utils/result.type';
import { type DemarchePcaet } from '@tet/domain/demarches';
import { DemarchePlanActionsRepository } from '@tet/backend/demarches/shared/demarche-plan-actions.repository';
import { GetDemarchePcaetRepository } from '../get-demarche-pcaet/get-demarche-pcaet.repository';
import { DemarchePcaetGuardsService } from '../shared/demarche-pcaet-guards.service';
import { DemarchePcaetPilotesRepository } from '../shared/demarche-pcaet-pilotes.repository';
import { DemarchePcaetAccessService } from '../shared/demarche-pcaet-access.service';
import {
  UpdateDemarchePcaetError,
  UpdateDemarchePcaetErrorEnum,
} from './update-demarche-pcaet.errors';
import { UpdateDemarchePcaetInput } from './update-demarche-pcaet.input';
import { UpdateDemarchePcaetRepository } from './update-demarche-pcaet.repository';

@Injectable()
export class UpdateDemarchePcaetService {
  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly accessService: DemarchePcaetAccessService,
    private readonly updateDemarchePcaetRepository: UpdateDemarchePcaetRepository,
    private readonly pilotesRepository: DemarchePcaetPilotesRepository,
    private readonly planActionsRepository: DemarchePlanActionsRepository,
    private readonly getDemarchePcaetRepository: GetDemarchePcaetRepository,
    private readonly guardsService: DemarchePcaetGuardsService
  ) {}

  async updateDemarchePcaet(
    input: UpdateDemarchePcaetInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaet, UpdateDemarchePcaetError>> {
    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<Result<DemarchePcaet, UpdateDemarchePcaetError>> => {
      const access = await this.accessService.assertWritable(input, 'amont', {
        user,
        tx: transaction,
      });
      if (!access.success) {
        return failure(UpdateDemarchePcaetErrorEnum[access.error]);
      }
      const demarche = access.data;

      if (input.planActionIds !== undefined) {
        const horsCollectivite =
          await this.updateDemarchePcaetRepository.findPlanActionsHorsCollectivite(
            input.planActionIds,
            demarche.collectiviteId,
            transaction
          );
        if (horsCollectivite.length > 0) {
          return failure(UpdateDemarchePcaetErrorEnum.INVALID_PLAN_ACTION);
        }

        // Exclusivité : un plan n'est tenu que par une seule démarche active.
        // Réécrire l'ensemble reste idempotent (la démarche est exclue).
        const holders =
          await this.planActionsRepository.findActiveDemarchesHoldingPlans(
            input.planActionIds,
            demarche.id,
            transaction
          );
        if (holders.length > 0) {
          return failure(UpdateDemarchePcaetErrorEnum.PLAN_DEJA_RATTACHE);
        }
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

      if (input.planActionIds !== undefined) {
        const planActionsResult =
          await this.planActionsRepository.setPlanActions(
            demarche.id,
            input.planActionIds,
            user.id,
            transaction
          );
        if (!planActionsResult.success) {
          return failure(
            planActionsResult.error === 'PLAN_DEJA_RATTACHE'
              ? UpdateDemarchePcaetErrorEnum.PLAN_DEJA_RATTACHE
              : UpdateDemarchePcaetErrorEnum.SET_PLAN_ACTIONS_ERROR
          );
        }
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
        data: await this.guardsService.enrich(
          getResult.data,
          user,
          transaction
        ),
      };
    };

    return this.transactionManager.executeSingle(executeInTransaction, tx);
  }
}
