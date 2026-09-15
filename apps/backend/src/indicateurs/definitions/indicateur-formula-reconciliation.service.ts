import { Injectable, Logger } from '@nestjs/common';
import { failure, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { getErrorMessage } from '@tet/domain/utils';
import CrudValeursService from '../valeurs/crud-valeurs.service';
import { IndicateurDefinitionLockRepository } from './indicateur-definition-lock.repository';
import { normalizeIndicateurFormula } from './indicateur-formula.rules';
import {
  IndicateurFormulaReconciliationRepository,
  type IndicateurFormulaReconciliationWorkItem,
} from './indicateur-formula-reconciliation.repository';
import { ListPlatformDefinitionsRepository } from './list-platform-definitions/list-platform-definitions.repository';

export const DEFAULT_FORMULA_RECONCILIATION_DRAIN_LIMIT = 25;
export const MAX_FORMULA_RECONCILIATION_DRAIN_LIMIT = 100;

type DrainIndicateurFormulaReconciliationsResult = Readonly<{
  processedCount: number;
  obsoleteCount: number;
  failedCount: number;
  remainingCount: number;
  complete: boolean;
  identifiants: string[];
}>;

type DrainIndicateurFormulaReconciliationsOptions = Readonly<{
  limit?: number;
  indicateurIds?: number[];
  includeDeferred?: boolean;
}>;

type ProcessedReconciliation =
  | Readonly<{ status: 'processed'; identifiants: string[] }>
  | Readonly<{ status: 'obsolete'; identifiants: [] }>;

class IndicateurFormulaReconciliationError extends Error {
  constructor(
    readonly workItem: IndicateurFormulaReconciliationWorkItem,
    error: unknown
  ) {
    super(getErrorMessage(error));
    this.name = IndicateurFormulaReconciliationError.name;
  }
}

@Injectable()
export class IndicateurFormulaReconciliationService {
  private readonly logger = new Logger(
    IndicateurFormulaReconciliationService.name
  );

  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly repository: IndicateurFormulaReconciliationRepository,
    private readonly definitionLockRepository: IndicateurDefinitionLockRepository,
    private readonly listPlatformDefinitionsRepository: ListPlatformDefinitionsRepository,
    private readonly crudValeursService: CrudValeursService
  ) {}

  async drain(
    options: DrainIndicateurFormulaReconciliationsOptions = {}
  ): Promise<DrainIndicateurFormulaReconciliationsResult> {
    const {
      limit = DEFAULT_FORMULA_RECONCILIATION_DRAIN_LIMIT,
      indicateurIds,
      includeDeferred = false,
    } = options;
    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > MAX_FORMULA_RECONCILIATION_DRAIN_LIMIT
    ) {
      throw new RangeError(
        `Formula reconciliation drain limit must be between 1 and ${MAX_FORMULA_RECONCILIATION_DRAIN_LIMIT}`
      );
    }

    if (indicateurIds && indicateurIds.length === 0) {
      return {
        processedCount: 0,
        obsoleteCount: 0,
        failedCount: 0,
        remainingCount: 0,
        complete: true,
        identifiants: [],
      };
    }

    let processedCount = 0;
    let obsoleteCount = 0;
    let failedCount = 0;
    const identifiants = new Set<string>();
    const attemptedWorkItemIds: string[] = [];

    for (let index = 0; index < limit; index++) {
      try {
        const result = await this.processNext({
          indicateurIds,
          includeDeferred,
          attemptedWorkItemIds,
        });

        if (!result) {
          break;
        }
        if (result.status === 'obsolete') {
          obsoleteCount++;
        } else {
          processedCount++;
          result.identifiants.forEach((identifiant) =>
            identifiants.add(identifiant)
          );
        }
      } catch (error) {
        // Une erreur avant le claim indique une indisponibilité de
        // l'infrastructure : poursuivre ne ferait que boucler sur le même
        // incident. Seule une intention effectivement claimée est différée.
        if (!(error instanceof IndicateurFormulaReconciliationError)) {
          throw error;
        }
        failedCount++;
        const message = error.message;
        this.logger.error(
          `Formula reconciliation ${error.workItem.id} failed: ${message}`
        );
        await this.repository.recordFailure(
          error.workItem.id,
          error.workItem.generation,
          message
        );
      }
    }

    const remainingCount = await this.repository.countPending(indicateurIds);
    const result = {
      processedCount,
      obsoleteCount,
      failedCount,
      remainingCount,
      complete: remainingCount === 0,
      identifiants: [...identifiants],
    };
    this.logger.log(`Formula reconciliation drain: ${JSON.stringify(result)}`);
    return result;
  }

  private async processNext(options: {
    indicateurIds?: number[];
    includeDeferred: boolean;
    attemptedWorkItemIds: string[];
  }): Promise<ProcessedReconciliation | null> {
    const transactionResult = await this.transactionManager.executeSingle<
      ProcessedReconciliation | null,
      IndicateurFormulaReconciliationError
    >(async (tx) => {
      // Ordre global : graphe, intention, définitions, périodes. Le revert et
      // les mutations de formule utilisent le même ordre en exclusif.
      await this.definitionLockRepository.lockForValueWrite(tx);
      const workItem = await this.repository.claimNext(tx, {
        indicateurIds: options.indicateurIds,
        includeDeferred: options.includeDeferred,
        excludedIds: [...options.attemptedWorkItemIds],
      });
      if (!workItem) {
        return success(null);
      }
      options.attemptedWorkItemIds.push(workItem.id);

      try {
        const [definition] =
          await this.listPlatformDefinitionsRepository.listPlatformDefinitions(
            { indicateurIds: [workItem.indicateurId] },
            tx
          );
        if (
          !definition ||
          normalizeIndicateurFormula(definition.valeurCalcule) !==
            workItem.expectedFormula
        ) {
          await this.repository.complete(workItem.id, tx);
          return success({ status: 'obsolete', identifiants: [] });
        }

        const reconciliation =
          await this.crudValeursService.reconcileCollectiviteCalculatedIndicateurValeurs(
            workItem.collectiviteId,
            [definition],
            tx
          );
        await this.repository.complete(workItem.id, tx);
        return success({
          status: 'processed',
          identifiants: reconciliation.identifiants,
        });
      } catch (error) {
        return failure(
          new IndicateurFormulaReconciliationError(workItem, error)
        );
      }
    });

    if (!transactionResult.success) {
      throw transactionResult.cause ?? transactionResult.error;
    }
    return transactionResult.data;
  }
}
