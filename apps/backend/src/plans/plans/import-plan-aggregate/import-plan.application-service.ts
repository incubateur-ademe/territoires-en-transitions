import { Injectable, Logger } from '@nestjs/common';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { CreatePlanAggregateService } from '@tet/backend/plans/plans/create-plan-aggregate/create-plan-aggregate.service';
import { PlanIndexerService } from '@tet/backend/plans/plans/plan-indexer/plan-indexer.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { PersonneId } from '@tet/domain/collectivites';
import { eq, or } from 'drizzle-orm';
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
    private readonly planAggregate: CreatePlanAggregateService,
    private readonly planIndexerService: PlanIndexerService,
    private readonly databaseService: DatabaseService
  ) {}

  async import(
    user: AuthenticatedUser,
    file: string,
    collectiviteId: number,
    planName: string,
    planType?: number,
    pilotes?: PersonneId[],
    referents?: PersonneId[]
  ): Promise<Result<{ planId: number; fichesCount: number }, ImportErrors>> {
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
    const validationResult = validateImportPlanInput(planResult.data);
    if (!validationResult.success) {
      return validationResult;
    }

    const fichesCount = planResult.data.actions.length;

    // 4. Execute import in transaction
    const saveResult = await this.transactionManager.executeSingle<
      { planId: number; fichesCount: number },
      ImportErrors
    >(async (tx) => {
      try {
        // 4a. Resolve entities (find or create tags/users)
        const resolvedEntitiesResult =
          await this.resolveEntityService.resolveFicheEntities(
            collectiviteId,
            planResult.data.actions,
            tx,
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
    });

    if (!saveResult.success) {
      this.logger.error('Error saving import data:', saveResult.error);
      return saveResult;
    }

    // Indexation Meilisearch post-commit : une fois la transaction
    // d'import committée, on enfile une upsert pour chaque axe (racine +
    // descendants) du plan importé. Les enqueues internes à
    // `CreatePlanAggregateService` ont déjà couvert les sous-axes mais sont
    // pré-commit ; ce filet de sécurité post-commit garantit qu'on ne perd
    // rien en cas de rollback inattendu et est dédupliqué par BullMQ via le
    // `jobId` (`plans:upsert:${id}`). Wrappé dans un try/catch + warn —
    // une panne BullMQ ne doit pas faire échouer l'import.
    try {
      const axesToReindex = await this.databaseService.db
        .select({ id: axeTable.id })
        .from(axeTable)
        .where(or(eq(axeTable.id, saveResult.data), eq(axeTable.plan, saveResult.data)));
      await Promise.all(
        axesToReindex.map(({ id }) => this.planIndexerService.enqueueUpsert(id))
      );
    } catch (err) {
      this.logger.warn(
        `Échec du re-enqueue post-commit des axes du plan ${saveResult.data} : ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }

    this.logger.log(`Import completed successfully`);
    return saveResult;
  }
}
