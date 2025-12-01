import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { MethodResult } from '@/backend/utils/result.type';
import { Injectable } from '@nestjs/common';
import { AxeType } from '../../fiches/shared/models/axe.table';
import { MutatePlanError, MutatePlanErrorEnum } from './mutate-plan.errors';
import {
  createPlanSchema,
  MutatePlanInput,
  updatePlanSchema,
} from './mutate-plan.input';
import { MutatePlanRepository } from './mutate-plan.repository';

@Injectable()
export class MutatePlanService {
  //private readonly logger = new Logger(MutatePlanService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly mutatePlanRepository: MutatePlanRepository,
    private readonly databaseService: DatabaseService
  ) {}

  async mutatePlan(
    plan: MutatePlanInput,
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<MethodResult<AxeType, MutatePlanError>> {
    const isAllowed = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['PLANS.MUTATE'],
      ResourceType.COLLECTIVITE,
      plan.collectiviteId,
      true
    );
    if (!isAllowed) {
      return {
        success: false,
        error: MutatePlanErrorEnum.UNAUTHORIZED,
      };
    }

    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<MethodResult<AxeType, MutatePlanError>> => {
      const { referents, pilotes, ...planProps } = plan;
      const updatePlanProps = updatePlanSchema.safeParse(planProps);

      let result;
      if (updatePlanProps.success) {
        result = await this.mutatePlanRepository.update(
          updatePlanProps.data,
          user.id,
          transaction
        );
      } else {
        const createPlanProps = createPlanSchema.safeParse(planProps);
        if (createPlanProps.success) {
          result = await this.mutatePlanRepository.create(
            createPlanProps.data,
            user.id,
            transaction
          );
        }
      }

      if (!result?.success) {
        return (
          result || {
            success: false,
            error: MutatePlanErrorEnum.CREATE_PLAN_ERROR,
          }
        );
      }

      // Met à jour les référents liés
      if (referents !== undefined) {
        const setReferentsResult = await this.mutatePlanRepository.setReferents(
          result.data.id,
          referents,
          user.id,
          transaction
        );
        if (!setReferentsResult.success) {
          return setReferentsResult;
        }
      }

      // Met à jour les pilotes liés
      if (pilotes !== undefined) {
        const setPilotesResult = await this.mutatePlanRepository.setPilotes(
          result.data.id,
          pilotes ?? null,
          user.id,
          transaction
        );
        if (!setPilotesResult.success) {
          return setPilotesResult;
        }
      }

      return { success: true, data: result.data };
    };

    // Utiliser la transaction fournie ou en créer une nouvelle
    return tx
      ? executeInTransaction(tx)
      : this.databaseService.db.transaction(async (newTx) =>
          executeInTransaction(newTx)
        );
  }
}
