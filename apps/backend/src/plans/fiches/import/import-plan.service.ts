import { Injectable, Logger } from '@nestjs/common';
import { PlanAggregateService } from '@tet/backend/plans/plans/upsert-plan-aggregate/upsert-plan-aggregate.service';
import { failure, Result, success } from '@tet/backend/shared/types/result';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { PersonneId } from '@tet/domain/collectivites';
import { adaptImportToPlanCreation } from './adapters/import-to-plan.adapter';
import {
  EntityResolutionError,
  ExcelParsingError,
  ImportErrors,
  PlanCreationError,
  TransactionError,
  TransformationError,
} from './import.errors';
import { parsePlanExcel } from './parsers/excel-parser';
import { EntityResolverService } from './resolvers/entity-resolver.service';
import { transformToPlan } from './transformers/plan-transformer';
import { validateImportedPlan } from './validators/plan.validator';

/**
 * Application Service: Plan Import
 *
 * Orchestrates the complete import workflow:
 * 1. Parse Excel file
 * 2. Transform to domain objects
 * 3. Validate business rules
 * 4. Resolve entities (find or create tags/users)
 * 5. Adapt import data to plan creation request
 * 6. Create plan aggregate
 *
 * This service is feature-specific (import) but delegates to:
 * - Generic domain service (PlanAggregateService)
 * - Pure adapters (no side effects, easily testable)
 * - Infrastructure services (EntityResolverService)
 *
 * All dependencies are injectable, making this service fully testable.
 */
@Injectable()
export class ImportPlanService {
  private readonly logger = new Logger(ImportPlanService.name);

  constructor(
    private readonly entityResolver: EntityResolverService,
    private readonly transactionManager: TransactionManager,
    private readonly planAggregate: PlanAggregateService
  ) {}

  async import(
    user: AuthenticatedUser,
    file: string,
    collectiviteId: number,
    planName: string,
    planType?: number,
    pilotes?: PersonneId[],
    referents?: PersonneId[]
  ): Promise<Result<boolean, ImportErrors>> {
    this.logger.log(
      `Starting import: ${planName} (type: ${planType}) for collectivité ${collectiviteId}`
    );

    // 1. Parse Excel file
    const parsedRows = await parsePlanExcel(file);
    if (!parsedRows.success) {
      return failure(new ExcelParsingError(parsedRows.error.message));
    }

    // 2. Transform to domain objects
    const planResult = await transformToPlan(
      parsedRows.data,
      planName,
      planType,
      pilotes,
      referents
    );
    if (!planResult.success) {
      return failure(new TransformationError(planResult.error));
    }

    // 3. Validate business rules
    const validationResult = await validateImportedPlan(planResult.data);
    if (!validationResult.success) {
      return validationResult;
    }

    // 4. Execute import in transaction
    const saveResult = await this.transactionManager.executeSingle<
      boolean,
      ImportErrors
    >(async (tx) => {
      try {
        // 4a. Resolve entities (find or create tags/users)
        const resolvedEntitiesResult =
          await this.entityResolver.resolveFicheEntities(
            collectiviteId,
            planResult.data.fiches,
            tx
          );

        if (!resolvedEntitiesResult.success) {
          return failure(
            new EntityResolutionError(
              'entities',
              'fiches',
              resolvedEntitiesResult.error
            )
          );
        }

        // 4b. Adapt import data to plan creation request
        const planCreationRequest = adaptImportToPlanCreation(
          planResult.data,
          resolvedEntitiesResult.data,
          collectiviteId
        );

        if (!planCreationRequest.success) {
          return failure(new PlanCreationError(planCreationRequest.error));
        }

        // 4c. Create plan aggregate
        const planCreationResult = await this.planAggregate.create(
          planCreationRequest.data,
          user,
          tx
        );

        if (!planCreationResult.success) {
          return failure(new PlanCreationError(planCreationResult.error));
        }

        return success(true);
      } catch (error) {
        this.logger.error('Error during import transaction:', error);
        return failure(new TransactionError(error));
      }
    });

    if (!saveResult.success) {
      this.logger.error('Error saving import data:', saveResult.error);
      return saveResult;
    }
    this.logger.log(`Import completed successfully`);
    return saveResult;
  }
}
