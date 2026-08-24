import { Injectable } from '@nestjs/common';
import { planActionTypeTable } from '@tet/backend/plans/fiches/shared/models/plan-action-type.table';
import { UpsertPlanService } from '@tet/backend/plans/plans/upsert-plan/upsert-plan.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  isFailedResult,
  TransactionManager,
} from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  isDemarchePcaetAmontModifiable,
  PCAET_PLAN_TYPE_KEY,
  type DemarchePcaet,
} from '@tet/domain/demarches';
import { and, eq } from 'drizzle-orm';
import { DemarchePlanActionsRepository } from '@tet/backend/demarches/shared/demarche-plan-actions.repository';
import { DemarchePcaetRefRepository } from '../shared/demarche-pcaet-ref.repository';
import type { UpdateDemarchePcaetError } from '../update-demarche-pcaet/update-demarche-pcaet.errors';
import { UpdateDemarchePcaetService } from '../update-demarche-pcaet/update-demarche-pcaet.service';
import {
  CreateAndLinkPlanError,
  CreateAndLinkPlanErrorEnum,
} from './create-and-link-plan.errors';
import { CreateAndLinkPlanInput } from './create-and-link-plan.input';

/**
 * `TransactionManager` relance un échec en exception (au lieu de le
 * retourner) dès qu'on lui partage une transaction — c'est ainsi qu'il
 * déclenche le rollback Drizzle. `updateDemarchePcaetService` l'utilise en
 * interne : appelé ici avec la transaction partagée, un de ses échecs y
 * remonte comme une exception plutôt que comme un `Result`, et traverserait
 * silencieusement le mapping ci-dessous s'il n'était pas récupéré ici.
 */
function recoverThrownFailure<E extends string>(
  error: unknown
): Result<never, E> {
  if (isFailedResult<E>(error)) {
    return error;
  }
  throw error;
}

/**
 * Crée un plan d'action du programme et le rattache à la démarche dans une
 * même transaction : pas d'état intermédiaire « plan créé mais non rattaché »
 * si le rattachement échoue. Miroir du checkout des paniers (create-or-link).
 * Le plan créé s'ajoute à ceux déjà rattachés — une démarche en tient plusieurs.
 */
@Injectable()
export class CreateAndLinkPlanService {
  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly demarchePcaetRefRepository: DemarchePcaetRefRepository,
    private readonly planActionsRepository: DemarchePlanActionsRepository,
    private readonly upsertPlanService: UpsertPlanService,
    private readonly updateDemarchePcaetService: UpdateDemarchePcaetService
  ) {}

  async createAndLinkPlan(
    input: CreateAndLinkPlanInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaet, CreateAndLinkPlanError>> {
    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<Result<DemarchePcaet, CreateAndLinkPlanError>> => {
      // Pré-checks avant de créer le plan, pour la précision des erreurs ;
      // l'atomicité reste garantie par la revalidation du update dans la
      // même transaction (permissions, statut éditable, exclusivité).
      const ref = await this.demarchePcaetRefRepository.findRef(
        input,
        undefined,
        transaction
      );
      if (!ref) {
        return failure(CreateAndLinkPlanErrorEnum.DEMARCHE_PCAET_NOT_FOUND);
      }
      if (!isDemarchePcaetAmontModifiable(ref.status)) {
        return failure(
          CreateAndLinkPlanErrorEnum.DEMARCHE_PCAET_NON_MODIFIABLE
        );
      }
      // Type du plan : celui choisi dans le formulaire, à défaut le type
      // PCAET résolu par sa clé fonctionnelle (son id n'est pas stable d'un
      // environnement à l'autre).
      const [planType] = await transaction
        .select({ id: planActionTypeTable.id, type: planActionTypeTable.type })
        .from(planActionTypeTable)
        .where(
          input.typeId !== undefined
            ? eq(planActionTypeTable.id, input.typeId)
            : and(
                eq(
                  planActionTypeTable.categorie,
                  PCAET_PLAN_TYPE_KEY.categorie
                ),
                eq(planActionTypeTable.type, PCAET_PLAN_TYPE_KEY.type)
              )
        )
        .limit(1);
      if (!planType) {
        return failure(
          input.typeId !== undefined
            ? CreateAndLinkPlanErrorEnum.INVALID_PLAN_TYPE
            : CreateAndLinkPlanErrorEnum.PCAET_PLAN_TYPE_NOT_FOUND
        );
      }

      // Permission PLANS.MUTATE vérifiée par le service de création, sur la
      // collectivité stockée de la démarche (règle IDOR).
      const planResult = await this.upsertPlanService.upsertPlan(
        {
          collectiviteId: ref.collectiviteId,
          nom: input.nom ?? planType.type,
          typeId: planType.id,
          referents: input.referents,
          pilotes: input.pilotes,
          dateDebut: input.dateDebut,
          dateFin: input.dateFin,
        },
        user,
        transaction
      );
      if (!planResult.success) {
        return failure(
          planResult.error === 'UNAUTHORIZED'
            ? CreateAndLinkPlanErrorEnum.UNAUTHORIZED
            : CreateAndLinkPlanErrorEnum.CREATE_PLAN_ERROR
        );
      }

      // Le rattachement revalide permission DEMARCHES.PCAET.MUTATE, statut
      // éditable et exclusivité dans la même transaction. L'ensemble des plans
      // est réécrit : on relit les rattachements en place pour n'en perdre
      // aucun.
      const planActionIds = await this.planActionsRepository.listPlanActionIds(
        ref.id,
        transaction
      );
      let updateResult: Result<DemarchePcaet, UpdateDemarchePcaetError>;
      try {
        updateResult =
          await this.updateDemarchePcaetService.updateDemarchePcaet(
            {
              collectiviteId: input.collectiviteId,
              demarcheId: input.demarcheId,
              planActionIds: [...planActionIds, planResult.data.id],
            },
            { user, tx: transaction }
          );
      } catch (error) {
        updateResult = recoverThrownFailure<UpdateDemarchePcaetError>(error);
      }
      if (!updateResult.success) {
        switch (updateResult.error) {
          case 'DEMARCHE_PCAET_NOT_FOUND':
          case 'DEMARCHE_PCAET_NON_MODIFIABLE':
          case 'PLAN_DEJA_RATTACHE':
          case 'UNAUTHORIZED':
            return failure(CreateAndLinkPlanErrorEnum[updateResult.error]);
          default:
            return failure(CreateAndLinkPlanErrorEnum.LINK_PLAN_ERROR);
        }
      }

      return success(updateResult.data);
    };

    return this.transactionManager.executeSingle(executeInTransaction, tx);
  }
}
