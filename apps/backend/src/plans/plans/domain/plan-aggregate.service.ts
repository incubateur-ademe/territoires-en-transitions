import { FicheService } from '@/backend/plans/fiches/services/fiche.service';
import {
  combineResults,
  failure,
  Result,
  success,
} from '@/backend/shared/types/result';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Injectable, Logger } from '@nestjs/common';
import { PlanError, PlanErrorType } from '../plans.errors';
import { PlanService } from '../plans.service';
import { PlanAggregateCreationRequest } from '../types/plan-aggregate-creation.types';
import {
  axisFormatter,
  extractUniqueAxes,
  findParentAxeId,
  validatePlanAggregate,
} from './plan.operations';

/**
 * Plan Aggregate Service (Domain Service)
 *
 * Orchestrates the creation of complete plan aggregates.
 * Handles the creation of:
 * - Plan (root axe)
 * - Hierarchical axes structure
 * - Fiches with proper linkage to axes
 *
 * This service is feature-agnostic and can be used by:
 * - Import feature
 * - Plan duplication
 * - Plan templates
 * - Any other feature that needs to create complete plans
 *
 * This service delegates business logic to pure operations (plan.operations.ts)
 * and focuses on orchestration and infrastructure concerns.
 */
@Injectable()
export class PlanAggregateService {
  private readonly logger = new Logger(PlanAggregateService.name);

  constructor(
    private readonly planService: PlanService,
    private readonly ficheService: FicheService
  ) {}

  /**
   * Creates a hierarchical structure of axes from axis paths
   * Uses pure operations to compute the creation order and validate hierarchy
   * @param paths Array of axis paths (e.g., [['Axe1', 'SousAxe1'], ['Axe1', 'SousAxe2']])
   * @param planId ID of the parent plan
   * @param collectiviteId ID of the collectivité
   * @param user Authenticated user
   * @param tx Database transaction
   * @returns Map of axis path (joined by '::') to axis ID
   */
  private async createAxesFromPaths(
    paths: string[][],
    planId: number,
    collectiviteId: number,
    user: AuthenticatedUser,
    tx: Transaction
  ): Promise<Result<Map<string, number>, PlanError>> {
    const axesToCreate = extractUniqueAxes(paths);

    const axeIdsByPath = new Map<string, number>();

    // Create axes in order (parents before children)
    for (const axe of axesToCreate) {
      const parentIdResult = findParentAxeId(axe.path, axeIdsByPath, planId);

      if (!parentIdResult.success) {
        this.logger.warn(
          `Parent axe not found: ${parentIdResult.error.message}`
        );
        return parentIdResult;
      }

      const nom = axe.path[axe.path.length - 1];

      const createdAxe = await this.planService.upsertAxe(
        {
          planId,
          parent: parentIdResult.data,
          collectiviteId,
          nom,
        },
        user,
        tx
      );

      if (!createdAxe.success) {
        return createdAxe;
      }

      axeIdsByPath.set(axe.fullPath, createdAxe.data.id);
    }

    return { success: true, data: axeIdsByPath };
  }

  /**
   * Creates a complete plan with fiches and axes structure
   * Uses pure operations for validation and orchestration logic
   * @param request Plan creation request
   * @param user Authenticated user
   * @param tx Database transaction
   * @returns Result with created plan ID
   */
  async create(
    request: PlanAggregateCreationRequest,
    user: AuthenticatedUser,
    tx: Transaction
  ): Promise<Result<number, PlanError>> {
    try {
      this.logger.log(
        `Creating plan ${request.nom} for collectivité ${request.collectiviteId}`
      );

      const allAxisPaths = request.fiches
        .map((f) => f.axisPath)
        .filter((path) => path !== undefined);

      const aggregateValidation = validatePlanAggregate(
        {
          collectiviteId: request.collectiviteId,
          nom: request.nom,
          typeId: request.typeId,
          pilotes: request.pilotes,
          referents: request.referents,
        },
        allAxisPaths
      );

      if (!aggregateValidation.isValid) {
        this.logger.warn(
          `Plan aggregate validation failed: ${aggregateValidation.errors.join(
            ', '
          )}`
        );
        return failure(PlanErrorType.INVALID_DATA);
      }

      // Step 1: Create all fiches
      const createdFichesResults = await Promise.all(
        request.fiches.map(async (ficheWithPath) => {
          const createdFiche = await this.ficheService.create(
            ficheWithPath.fiche,
            tx
          );

          if (!createdFiche.success) {
            return createdFiche;
          }

          return success({
            id: createdFiche.data,
            axisPath: ficheWithPath.axisPath,
          });
        })
      );

      const fichesCreationResults = combineResults(createdFichesResults);
      if (fichesCreationResults.success === false) {
        return failure(PlanErrorType.DATABASE_ERROR);
      }

      const createdFiches = createdFichesResults
        .filter((f) => f.success)
        .map((f) => f.data);

      // Step 2: Create the plan (root axe)
      const createPlanResult = await this.planService.createPlan(
        {
          collectiviteId: request.collectiviteId,
          nom: request.nom,
          typeId: request.typeId,
          pilotes: request.pilotes,
          referents: request.referents,
        },
        user,
        tx
      );

      if (!createPlanResult.success) {
        return createPlanResult;
      }

      // Step 3: Create axes
      const axeResult = await this.createAxesFromPaths(
        allAxisPaths,
        createPlanResult.data.id,
        request.collectiviteId,
        user,
        tx
      );

      if (!axeResult.success) {
        return axeResult;
      }

      // Step 4: Link fiches to their respective axes
      const axeIdsByPath = axeResult.data;
      const planId = createPlanResult.data.id;

      const linkedFiches = await Promise.all(
        createdFiches.map((fiche) => {
          if (!fiche.id) {
            return null;
          }

          // Get axe ID from the path, or use plan ID if no axe exists
          const axeId = fiche.axisPath
            ? axeIdsByPath.get(axisFormatter.serialize(fiche.axisPath))
            : undefined;

          // fiches without axe are linked directly to the plan
          const parentAxeId = axeId ?? planId;

          return this.ficheService.linkFicheToAxe(fiche.id, parentAxeId, tx);
        })
      );

      // Check if any fiche linking failed
      const linkErrors = linkedFiches.filter((f) => f && !f.success);
      if (linkErrors.length > 0) {
        return failure(PlanErrorType.DATABASE_ERROR);
      }

      this.logger.log(
        `Successfully created plan ${request.nom} (ID: ${createPlanResult.data.id})`
      );

      return { success: true, data: createPlanResult.data.id };
    } catch (error) {
      this.logger.error(`Error creating plan:`, error);
      return {
        success: false,
        error: PlanErrorType.DATABASE_ERROR,
      };
    }
  }
}
