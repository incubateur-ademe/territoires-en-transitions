import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { MethodResult } from '@/backend/utils/result.type';
import { Injectable, Logger } from '@nestjs/common';
import { DeleteFicheService } from '../../fiches/delete-fiche/delete-fiche.service';
import { GetPlanErrorEnum } from '../get-plan/get-plan.errors';
import { GetPlanService } from '../get-plan/get-plan.service';
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
    private readonly deleteFicheService: DeleteFicheService
  ) {}

  async deletePlan(
    input: DeletePlanInput,
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<MethodResult<void, DeletePlanError>> {
    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<MethodResult<void, DeletePlanError>> => {
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
      const { impactedFicheIds } = deleteResult.data;
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

    return tx
      ? executeInTransaction(tx)
      : this.databaseService.db.transaction((transaction) =>
          executeInTransaction(transaction)
        );
  }
}
