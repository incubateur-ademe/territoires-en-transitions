import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { PlanSourceEnum } from '@tet/domain/plans';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { GetPlanRepository } from '../get-plan/get-plan.repository';
import { PlanVerificationRepository } from './plan-verification.repository';
import { VerifyPlanError, VerifyPlanErrorEnum } from './verify-plan.errors';
import { VerifyPlanInput } from './verify-plan.input';

@Injectable()
export class VerifyPlanService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly getPlanRepository: GetPlanRepository,
    private readonly planVerificationRepository: PlanVerificationRepository
  ) {}

  /** Confirme qu'un plan importé par IA est conforme à son document. */
  async verifyPlan(
    { planId }: VerifyPlanInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<{ verifiedAt: string }, VerifyPlanError>> {
    const plan = await this.getPlanRepository.getPlan({ planId }, tx);
    if (!plan.success) {
      return failure(VerifyPlanErrorEnum.PLAN_NOT_FOUND);
    }

    const permission = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['PLANS.MUTATE'],
      ResourceType.COLLECTIVITE,
      { collectiviteId: plan.data.collectiviteId },
      tx
    );
    if (!permission.success) {
      return failure(VerifyPlanErrorEnum.UNAUTHORIZED);
    }

    if (plan.data.source !== PlanSourceEnum.IMPORT_IA) {
      return failure(VerifyPlanErrorEnum.PLAN_NOT_IMPORTED);
    }
    if (plan.data.verifiedAt) {
      return success({ verifiedAt: plan.data.verifiedAt });
    }

    const verified = await this.planVerificationRepository.markAsVerified(
      { planId, userId: user.id },
      tx
    );
    if (!verified.success) {
      return verified;
    }
    if (verified.data) {
      return success(verified.data);
    }

    // Validation concurrente : l'autre a gagné, on relit sa date.
    const reread = await this.getPlanRepository.getPlan({ planId }, tx);
    return reread.success && reread.data.verifiedAt
      ? success({ verifiedAt: reread.data.verifiedAt })
      : failure(VerifyPlanErrorEnum.VERIFY_PLAN_ERROR);
  }
}
