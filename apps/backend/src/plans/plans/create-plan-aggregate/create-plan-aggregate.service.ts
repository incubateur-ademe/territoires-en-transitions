import { Injectable, Logger } from '@nestjs/common';
import { CreateFicheService } from '@tet/backend/plans/fiches/create-fiche/create-fiche.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  combineResults,
  failure,
  Result,
  success,
} from '@tet/backend/utils/result.type';
import { FicheCreate } from '@tet/domain/plans';
import { UpsertAxeError } from '../../axes/upsert-axe/upsert-axe.errors';
import { UpsertAxeService } from '../../axes/upsert-axe/upsert-axe.service';
import { PlanError, PlanErrorType } from '../plans.errors';
import { UpsertPlanError } from '../upsert-plan/upsert-plan.errors';
import { UpsertPlanService } from '../upsert-plan/upsert-plan.service';
import {
  axisFormatter,
  extractUniqueAxes,
  findParentAxeId,
  validatePlanAggregate,
} from './create-plan-aggregate.rule';
import { CreatePlanAggregateInput } from './create-plan-aggregate.types';

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
export class CreatePlanAggregateService {
  private readonly logger = new Logger(CreatePlanAggregateService.name);

  constructor(
    private readonly createFicheService: CreateFicheService,
    private readonly upsertAxeService: UpsertAxeService,
    private readonly upsertPlanService: UpsertPlanService
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
  ): Promise<Result<Map<string, number>, PlanError | UpsertAxeError>> {
    const axesToCreate = extractUniqueAxes(paths);

    const axeIdsByPath = new Map<string, number>();

    // Create axes in order (parents before children)
    for (const axe of axesToCreate) {
      const parentIdResult = findParentAxeId(axe.path, axeIdsByPath, planId);

      if (!parentIdResult.success) {
        return parentIdResult;
      }

      const nom = axe.path[axe.path.length - 1];

      const createdAxe = await this.upsertAxeService.upsertAxe(
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
    request: CreatePlanAggregateInput,
    user: AuthenticatedUser,
    tx: Transaction
  ): Promise<Result<number, PlanError | UpsertAxeError | UpsertPlanError>> {
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
      // Step 1: Create the plan (root axe)
      const createPlanResult = await this.upsertPlanService.upsertPlan(
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

      // Step 2: Create axes
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

      // Step 3: Create all fiches
      const createdFichesResults = await Promise.all(
        request.fiches.map(async (ficheWithPath) => {
          const axeId = ficheWithPath.axisPath
            ? axeResult.data.get(
                axisFormatter.serialize(ficheWithPath.axisPath)
              )
            : createPlanResult.data.id;
          const ficheToCreate: FicheCreate = {
            ...ficheWithPath.fiche,
            collectiviteId: request.collectiviteId,
            tempsDeMiseEnOeuvre:
              ficheWithPath.fiche.tempsDeMiseEnOeuvre?.id ?? null,
          };
          const createdFiche = await this.createFicheService.createFiche(
            ficheToCreate,
            {
              ficheFields: {
                ...ficheWithPath.fiche,
                axes: axeId ? [{ id: axeId }] : undefined,
              },
              user,
              tx,
            }
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
