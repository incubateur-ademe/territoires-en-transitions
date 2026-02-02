import { Injectable, Logger } from '@nestjs/common';
import { CreatePlanAggregateService } from '@tet/backend/plans/plans/create-plan-aggregate/create-plan-aggregate.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { PersonneId } from '@tet/domain/collectivites';
import { importPlanInputToCreatePlanAggregateInput } from './adapters/import-plan-input-to-create-plan-aggregate-input';
import { createImportPlanInput } from './factories/create-plan-import-input.factory';
import {
  EntityResolutionError,
  ExcelParsingError,
  ImportErrors,
  PlanCreationError,
  TransactionError,
  TransformationError,
} from './import.errors';
import { parsePlanExcel } from './parsers/excel-parser';
import { ResolveEntityService } from './resolvers/resolve-entity.service';
import { validateImportPlanInput } from './validators/plan.rule';

@Injectable()
export class ImportPlanApplicationService {
  private readonly logger = new Logger(ImportPlanApplicationService.name);

  constructor(
    private readonly resolveEntityService: ResolveEntityService,
    private readonly transactionManager: TransactionManager,
    private readonly planAggregate: CreatePlanAggregateService
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
    // 1. Parse Excel file
    const parsedRows = await parsePlanExcel(file);
    if (!parsedRows.success) {
      return failure(new ExcelParsingError(parsedRows.error.message));
    }

    // 2. Transform to domain objects
    const planResult = await createImportPlanInput(
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
    const validationResult = await validateImportPlanInput(planResult.data);
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
          await this.resolveEntityService.resolveFicheEntities(
            collectiviteId,
            planResult.data.fiches,
            tx,
            user
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
        const planCreationRequest = importPlanInputToCreatePlanAggregateInput(
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
