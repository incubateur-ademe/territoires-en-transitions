import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { CheckElectrificationCreationService } from '../electrification/check-electrification-creation.service';
import { ListPlanTypesService } from '../list-plan-types/list-plan-types.service';
import { PlanCreateAuthorization } from '../upsert-plan/plan-create-authorization';
import { UpsertPlanInput } from '../upsert-plan/upsert-plan.input';
import { UpsertPlanRepository } from '../upsert-plan/upsert-plan.repository';

/** Compose les disponibilités de création sans modifier le catalogue des types. */
@Injectable()
export class CheckPlanCreationService {
  constructor(
    private readonly permissions: PermissionService,
    private readonly planTypes: ListPlanTypesService,
    private readonly plans: UpsertPlanRepository,
    private readonly electrification: CheckElectrificationCreationService
  ) {}

  async getCapabilities(
    input: { collectiviteId: number },
    context: ServiceSecondArg
  ): Promise<Result<{ unavailableTypeIds: number[] }, 'UNAUTHORIZED'>> {
    const permission = await this.permissions.isAllowed(
      context.user,
      PermissionOperationEnum['PLANS.MUTATE'],
      ResourceType.COLLECTIVITE,
      input,
      context.tx
    );
    if (!permission.success) return failure('UNAUTHORIZED');

    const types = await this.planTypes.listPlanTypes();
    const unavailableTypeIds = (await this.electrification.isEnabled(
      input,
      context
    ))
      ? []
      : types
          .filter((type) => this.electrification.appliesTo(type))
          .map(({ id }) => id);
    return success({ unavailableTypeIds });
  }

  /** Les droits d'écriture sont contrôlés par le service d'upsert. */
  async check(
    plan: UpsertPlanInput,
    context: ServiceSecondArg & {
      tx: Transaction;
      planCreateAuthorization?: PlanCreateAuthorization;
    }
  ): Promise<Result<void, 'PLAN_CREATION_DISABLED'>> {
    if (plan.typeId == null) return success(undefined);
    const type = await this.plans.findPlanType(plan.typeId, context.tx);
    // Un type inexistant reste traité par la contrainte de clé étrangère.
    if (!type || !this.electrification.appliesTo(type))
      return success(undefined);

    if ('id' in plan) {
      // Le type conservé doit rester identique jusqu'à l'update du plan.
      const existing = await this.plans.findPlanAxe(
        plan.id,
        context.tx,
        'update'
      );
      if (
        existing?.parent === null &&
        existing.typeId === plan.typeId &&
        existing.collectiviteId === plan.collectiviteId
      )
        return success(undefined);
    }

    if (
      context.planCreateAuthorization?.matches(plan, {
        user: context.user,
        tx: context.tx,
      })
    )
      return success(undefined);

    return (await this.electrification.isEnabled(plan, context))
      ? success(undefined)
      : failure('PLAN_CREATION_DISABLED');
  }
}
