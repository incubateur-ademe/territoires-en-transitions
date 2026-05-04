import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { DeleteFicheService } from '../../fiches/delete-fiche/delete-fiche.service';
import { GetPlanErrorEnum } from '../get-plan/get-plan.errors';
import { GetPlanService } from '../get-plan/get-plan.service';
import { PlanIndexerService } from '../plan-indexer/plan-indexer.service';
import { DeletePlanError, DeletePlanErrorEnum } from './delete-plan.errors';
import { DeletePlanInput } from './delete-plan.input';
import { DeletePlanRepository } from './delete-plan.repository';

@Injectable()
export class DeletePlanService {
  private readonly logger = new Logger(DeletePlanService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly getPlanService: GetPlanService,
    private readonly deletePlanRepository: DeletePlanRepository,
    private readonly deleteFicheService: DeleteFicheService,
    private readonly planIndexerService: PlanIndexerService
  ) {}

  async deletePlan(
    input: DeletePlanInput,
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<Result<void, DeletePlanError>> {
    // On accumule les axes effectivement supprimés pour les renvoyer en
    // suppression côté Meilisearch APRÈS le commit. Tant qu'on est dans la
    // transaction, ils peuvent encore être rollbackés.
    const deletedAxeIdsForIndexing: number[] = [];

    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<Result<void, DeletePlanError>> => {
      // Récupére le plan pour obtenir le collectiviteId
      const planResult = await this.getPlanService.getPlan(
        { planId: input.planId },
        user,
        transaction
      );

      if (!planResult.success) {
        return {
          success: false,
          error:
            planResult.error === GetPlanErrorEnum.UNAUTHORIZED
              ? DeletePlanErrorEnum.UNAUTHORIZED
              : DeletePlanErrorEnum.PLAN_NOT_FOUND,
        };
      }

      const plan = planResult.data;
      const collectiviteId = plan.collectiviteId;

      // Vérifier les permissions
      const isAllowed = await this.permissionService.isAllowed(
        user,
        PermissionOperationEnum['PLANS.MUTATE'],
        ResourceType.COLLECTIVITE,
        collectiviteId,
        true
      );

      if (!isAllowed) {
        this.logger.log(
          `User ${user.id} is not allowed to delete plan ${input.planId} for collectivité ${collectiviteId}`
        );
        return {
          success: false,
          error: DeletePlanErrorEnum.UNAUTHORIZED,
        };
      }

      // Supprimer le plan et tous ses axes enfants
      const deleteResult =
        await this.deletePlanRepository.deletePlanAndChildrenAxes(
          input.planId,
          transaction
        );

      if (!deleteResult.success) {
        return deleteResult;
      }

      // Supprimer les fiches orphelines
      const { impactedFicheIds, deletedAxeIds } = deleteResult.data;
      deletedAxeIdsForIndexing.push(...deletedAxeIds);
      if (impactedFicheIds.length > 0) {
        await Promise.all(
          impactedFicheIds.map((ficheId) =>
            this.deleteFicheService.deleteFiche({ ficheId, user, transaction })
          )
        );
      }

      return {
        success: true,
        data: undefined,
      };
    };

    const result = await (tx
      ? executeInTransaction(tx)
      : this.databaseService.db.transaction((transaction) =>
          executeInTransaction(transaction)
        ));

    // Indexation Meilisearch : suppression de tous les axes (racine +
    // enfants) qui viennent d'être supprimés. Wrappé dans un try/catch +
    // warn pour qu'une panne d'enqueue n'empêche pas la requête utilisateur
    // de réussir — l'admin backfill (U8) corrige la dérive éventuelle.
    // NB : la suppression cascadée des fiches sera gérée par
    // `DeleteFicheService` lui-même en U4 ; ici on n'enfile que les axes.
    if (result.success && deletedAxeIdsForIndexing.length > 0) {
      try {
        await Promise.all(
          deletedAxeIdsForIndexing.map((axeId) =>
            this.planIndexerService.enqueueDelete(axeId)
          )
        );
      } catch (err) {
        this.logger.warn(
          `Échec de l'enqueue de suppression d'index pour le plan ${input.planId} : ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }

    return result;
  }
}
