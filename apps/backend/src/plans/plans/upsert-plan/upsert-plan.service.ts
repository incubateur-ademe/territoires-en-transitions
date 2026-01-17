import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { AxeLight } from '@tet/domain/plans';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { UpsertPlanError, UpsertPlanErrorEnum } from './upsert-plan.errors';
import {
  baseCreatePlanSchema,
  baseUpdatePlanSchema,
  UpsertPlanInput,
} from './upsert-plan.input';
import { UpsertPlanRepository } from './upsert-plan.repository';

@Injectable()
export class UpsertPlanService {
  private readonly logger = new Logger(UpsertPlanService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly upsertPlanRepository: UpsertPlanRepository,
    private readonly databaseService: DatabaseService
  ) {}

  async upsertPlan(
    plan: UpsertPlanInput,
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<Result<AxeLight, UpsertPlanError>> {
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
        error: UpsertPlanErrorEnum.UNAUTHORIZED,
      };
    }

    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<Result<AxeLight, UpsertPlanError>> => {
      const { referents, pilotes, ...planProps } = plan;
      const updatePlanProps = baseUpdatePlanSchema.safeParse(planProps);

      let result;
      if (updatePlanProps.success) {
        result = await this.upsertPlanRepository.update(
          updatePlanProps.data,
          user.id,
          transaction
        );
      } else {
        const createPlanProps = baseCreatePlanSchema.safeParse(planProps);
        if (createPlanProps.success) {
          result = await this.upsertPlanRepository.create(
            createPlanProps.data,
            user.id,
            transaction
          );
        } else {
          this.logger.log(
            `Parsing error detected into input: ${createPlanProps.error}`
          );
        }
      }

      if (!result?.success) {
        return (
          result || {
            success: false,
            error: UpsertPlanErrorEnum.CREATE_PLAN_ERROR,
          }
        );
      }

      // Met à jour les référents liés
      if (referents !== undefined) {
        const setReferentsResult = await this.upsertPlanRepository.setReferents(
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
        const setPilotesResult = await this.upsertPlanRepository.setPilotes(
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
