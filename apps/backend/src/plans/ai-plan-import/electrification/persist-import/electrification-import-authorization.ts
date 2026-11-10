import { planActionTypeTable } from '@tet/backend/plans/fiches/shared/models/plan-action-type.table';
import { CheckElectrificationEligibilityError } from '@tet/backend/plans/plans/electrification/check-electrification-eligibility/check-electrification-eligibility.errors';
import { CheckElectrificationEligibilityService } from '@tet/backend/plans/plans/electrification/check-electrification-eligibility/check-electrification-eligibility.service';
import { PlanCreateAuthorization } from '@tet/backend/plans/plans/upsert-plan/plan-create-authorization';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ELECTRIFICATION_PLAN_TYPE_KEY } from '@tet/domain/plans';
import { and, eq } from 'drizzle-orm';

type AuthorizationContext = { user: AuthenticatedUser; tx: Transaction };

/** Autorise uniquement la création interne du plan importé sous la même transaction. */
export class ElectrificationImportAuthorization extends PlanCreateAuthorization {
  private constructor(
    userId: string,
    collectiviteId: number,
    typeId: number,
    tx: Transaction
  ) {
    super(userId, collectiviteId, typeId, tx);
  }

  static async forCollectivite(
    eligibility: CheckElectrificationEligibilityService,
    { collectiviteId }: { collectiviteId: number },
    context: AuthorizationContext
  ): Promise<
    Result<
      ElectrificationImportAuthorization,
      CheckElectrificationEligibilityError
    >
  > {
    const decision = await eligibility.check({ collectiviteId }, context);
    if (!decision.success) return decision;
    if (!decision.data.eligible) return failure('UNAUTHORIZED');

    try {
      const [type] = await context.tx
        .select({ id: planActionTypeTable.id })
        .from(planActionTypeTable)
        .where(
          and(
            eq(
              planActionTypeTable.categorie,
              ELECTRIFICATION_PLAN_TYPE_KEY.categorie
            ),
            eq(planActionTypeTable.type, ELECTRIFICATION_PLAN_TYPE_KEY.type)
          )
        )
        .for('share');
      if (!type) return failure('NOT_FOUND');

      return success(
        new ElectrificationImportAuthorization(
          context.user.id,
          collectiviteId,
          type.id,
          context.tx
        )
      );
    } catch (error) {
      return failure(
        'DATABASE_ERROR',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
