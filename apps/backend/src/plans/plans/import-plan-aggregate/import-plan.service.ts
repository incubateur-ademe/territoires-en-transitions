import { Injectable, Logger } from '@nestjs/common';
import { CreatePlanAggregateService } from '@tet/backend/plans/plans/create-plan-aggregate/create-plan-aggregate.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { importPlanInputToCreatePlanAggregateInput } from './adapters/import-plan-input-to-create-plan-aggregate-input';
import { ImportPlanInput } from './import-plan.input';
import {
  EntityResolutionError,
  ImportErrors,
  PlanCreationError,
  TransactionError,
} from './import.errors';
import { ResolveEntityService } from './resolvers/resolve-entity.service';
import { validateImportPlanInput } from './validators/plan.rule';

@Injectable()
export class ImportPlanService {
  private readonly logger = new Logger(ImportPlanService.name);

  constructor(
    private readonly resolveEntityService: ResolveEntityService,
    private readonly transactionManager: TransactionManager,
    private readonly planAggregate: CreatePlanAggregateService
  ) {}

  async save(args: {
    planInput: ImportPlanInput;
    collectiviteId: number;
    user: AuthenticatedUser;
    tx?: Transaction;
  }): Promise<Result<{ planId: number; fichesCount: number }, ImportErrors>> {
    const { planInput, collectiviteId, user, tx } = args;

    // 1. Validate business rules
    const validationResult = validateImportPlanInput(planInput);
    if (!validationResult.success) {
      return validationResult;
    }

    const fichesCount = planInput.actions.length;

    // 2. Execute import in transaction
    const saveResult = await this.transactionManager.executeSingle<
      { planId: number; fichesCount: number },
      ImportErrors
    >(async (transaction) => {
      try {
        // 2a. Resolve entities (find or create tags/users)
        const resolvedEntitiesResult =
          await this.resolveEntityService.resolveFicheEntities(
            collectiviteId,
            planInput.actions,
            transaction,
            user
          );

        if (!resolvedEntitiesResult.success) {
          return failure(
            new EntityResolutionError(
              'entities',
              'actions',
              resolvedEntitiesResult.error
            )
          );
        }

        // 2b. Adapt import data to plan creation request
        const planCreationRequest = importPlanInputToCreatePlanAggregateInput(
          planInput,
          resolvedEntitiesResult.data,
          collectiviteId
        );

        if (!planCreationRequest.success) {
          return failure(new PlanCreationError(planCreationRequest.error));
        }

        // 2c. Create plan aggregate
        const planCreationResult = await this.planAggregate.create(
          planCreationRequest.data,
          user,
          transaction
        );

        if (!planCreationResult.success) {
          return failure(
            new PlanCreationError(
              planCreationResult.cause?.message ?? planCreationResult.error
            )
          );
        }

        return success({ planId: planCreationResult.data, fichesCount });
      } catch (error) {
        this.logger.error('Error during import transaction:', error);
        return failure(new TransactionError(error));
      }
    }, tx);

    if (!saveResult.success) {
      this.logger.error('Error saving import data:', saveResult.error);
      return saveResult;
    }
    this.logger.log(`Import completed successfully`);
    return saveResult;
  }
}
