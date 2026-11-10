import { Injectable } from '@nestjs/common';
import { EnqueueCompletePlanSecteursService } from '@tet/backend/plans/fiches/fiche-secteurs/complete-plan-secteurs/enqueue-complete-plan-secteurs.service';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result } from '@tet/backend/utils/result.type';
import { type DemarchePcaet } from '@tet/domain/demarches';
import { PermissionOperationEnum } from '@tet/domain/users';
import { DemarchePlanActionsRepository } from '@tet/backend/demarches/shared/demarche-plan-actions.repository';
import { GetDemarchePcaetRepository } from '../get-demarche-pcaet/get-demarche-pcaet.repository';
import { DemarchePcaetGuardsService } from '../shared/demarche-pcaet-guards.service';
import { DemarchePcaetPilotesRepository } from '../shared/demarche-pcaet-pilotes.repository';
import { DemarchePcaetAccessService } from '../shared/demarche-pcaet-access.service';
import {
  DemarchePcaetActeurEnum,
  DemarchePcaetEventEnum,
} from '../shared/tracking/demarche-pcaet-tracking.constants';
import { DemarchePcaetTrackingService } from '../shared/tracking/demarche-pcaet-tracking.service';
import {
  UpdateDemarchePcaetError,
  UpdateDemarchePcaetErrorEnum,
} from './update-demarche-pcaet.errors';
import { UpdateDemarchePcaetInput } from './update-demarche-pcaet.input';
import { UpdateDemarchePcaetRepository } from './update-demarche-pcaet.repository';

/** La requête ne renseigne que `champ`, en plus des identifiants. */
const touchesOnly = (
  { collectiviteId, demarcheId, ...champs }: UpdateDemarchePcaetInput,
  champ: 'pilotes' | 'planActionIds'
): boolean =>
  champs[champ] !== undefined &&
  Object.entries(champs).every(
    ([key, value]) => key === champ || value === undefined
  );

@Injectable()
export class UpdateDemarchePcaetService {
  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly accessService: DemarchePcaetAccessService,
    private readonly updateDemarchePcaetRepository: UpdateDemarchePcaetRepository,
    private readonly pilotesRepository: DemarchePcaetPilotesRepository,
    private readonly planActionsRepository: DemarchePlanActionsRepository,
    private readonly getDemarchePcaetRepository: GetDemarchePcaetRepository,
    private readonly guardsService: DemarchePcaetGuardsService,
    private readonly enqueueCompletePlanSecteursService: EnqueueCompletePlanSecteursService,
    private readonly trackingService: DemarchePcaetTrackingService
  ) {}

  async updateDemarchePcaet(
    input: UpdateDemarchePcaetInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaet, UpdateDemarchePcaetError>> {
    let addedPlanIds: number[] = [];
    let removedPlanIds: number[] = [];
    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<Result<DemarchePcaet, UpdateDemarchePcaetError>> => {
      // Le rattachement des plans relève du contenu du dossier, rouvert après
      // les avis ; l'en-tête, de l'amont. Une requête qui touche aux deux suit
      // la règle la plus stricte.
      //
      // Les pilotes désignent qui porte la démarche, pas le contenu du dossier :
      // un admin peut les changer à tout statut, à condition de ne rien toucher
      // d'autre dans la même requête.
      const access = await this.accessService.assertWritable(
        input,
        touchesOnly(input, 'planActionIds') ? 'contenu' : 'amont',
        {
          user,
          tx: transaction,
          bypassEtapeWith: touchesOnly(input, 'pilotes')
            ? PermissionOperationEnum[
                'DEMARCHES.PCAET.MUTATE_PILOTES_ANY_STATUS'
              ]
            : undefined,
        }
      );
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
        const before = await this.planActionsRepository.listPlanActionIds(
          demarche.id,
          transaction
        );
        removedPlanIds = before.filter(
          (id) => !input.planActionIds?.includes(id)
        );
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
        addedPlanIds = planActionsResult.data;
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

    const result = await this.transactionManager.executeSingle(
      executeInTransaction,
      tx
    );
    if (result.success && !tx) {
      void this.enqueueCompletePlanSecteursService.enqueue({
        planIds: addedPlanIds,
        collectiviteId: result.data.collectiviteId,
        userId: user.id,
      });
    }
    // Appelée dans la transaction d'une autre opération (création d'un plan
    // rattaché), c'est cette opération qui dit ce qui s'est passé.
    if (result.success && !tx) {
      this.trackUpdate(input, result.data, user.id, {
        addedPlanIds,
        removedPlanIds,
      });
    }
    return result;
  }

  private trackUpdate(
    { collectiviteId, demarcheId, ...champs }: UpdateDemarchePcaetInput,
    demarche: DemarchePcaet,
    userId: string,
    {
      addedPlanIds,
      removedPlanIds,
    }: { addedPlanIds: number[]; removedPlanIds: number[] }
  ) {
    const context = { userId, acteur: DemarchePcaetActeurEnum.COLLECTIVITE };
    this.trackingService.track(DemarchePcaetEventEnum.MODIFIEE, demarche, {
      ...context,
      properties: {
        champsModifies: Object.entries(champs)
          .filter(([, value]) => value !== undefined)
          .map(([key]) => key),
      },
    });
    for (const planId of addedPlanIds) {
      this.trackingService.track(
        DemarchePcaetEventEnum.PLAN_RATTACHE,
        demarche,
        {
          ...context,
          properties: {
            planId,
            source: 'existant',
            aVerifier: demarche.unverifiedPlanActionIds.includes(planId),
            nbPlansApres: demarche.planActionIds.length,
          },
        }
      );
    }
    for (const planId of removedPlanIds) {
      this.trackingService.track(
        DemarchePcaetEventEnum.PLAN_DISSOCIE,
        demarche,
        {
          ...context,
          properties: { planId, nbPlansApres: demarche.planActionIds.length },
        }
      );
    }
  }
}
