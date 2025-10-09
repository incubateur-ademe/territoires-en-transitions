import { PlanService } from '@/backend/plans/plans/plans.service';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Injectable, Logger } from '@nestjs/common';
import { FicheService } from '../../services/fiche.service';
import { toFicheAggregate } from '../../utils/to-fiche-aggregate';
import { PlanImport } from '../import-plan.dto';
import { FicheImport } from '../schemas/import.schema';
import { Result, failure, success } from '../types/result';

/**
 * PlanAggregate represents a complete plan with its axes and fiches.
 * It handles the creation and management of the entire plan structure,
 * ensuring data consistency and proper relationships between entities.
 */
@Injectable()
export class PlanAggregateService {
  private readonly logger = new Logger(PlanAggregateService.name);

  constructor(
    private readonly planService: PlanService,
    private readonly ficheService: FicheService
  ) {}

  private async createFiche(
    fiche: FicheImport,
    collectiviteId: number,
    tx: Transaction
  ): Promise<Result<number, string>> {
    try {
      if (!fiche.resolvedEntities) {
        return failure('Missing resolved entities for fiche');
      }

      const ficheInput = toFicheAggregate(
        fiche,
        fiche.resolvedEntities,
        collectiviteId
      );

      const ficheId = await this.ficheService.create(ficheInput, tx);
      if (!ficheId.success) {
        return failure(ficheId.error);
      }

      return success(ficheId.data);
    } catch (error) {
      this.logger.error(`Error creating fiche ${fiche.titre}:`, error);
      return failure(
        `Error creating fiche ${fiche.titre}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Create axes from a list of axis paths
   */
  private async createAxesFromPaths(
    paths: string[][],
    planId: number,
    collectiviteId: number,
    user: AuthenticatedUser,
    tx: Transaction
  ): Promise<Result<Map<string, number>, string>> {
    try {
      // Get unique paths and sort by depth
      const uniquePaths = Array.from(
        new Set(paths.map((p) => JSON.stringify(p)))
      )
        .map((p) => JSON.parse(p) as string[])
        .sort((a, b) => a.length - b.length);

      // Create axes level by level
      const axeIdsByPath = new Map<string, number>();

      for (const axisPath of uniquePaths) {
        const parentPath = axisPath.slice(0, -1);
        const parentId =
          parentPath.length > 0
            ? axeIdsByPath.get(JSON.stringify(parentPath))
            : undefined;

        const axeId = await this.planService.upsertAxe(
          {
            planId,
            parent: parentId || 0,
            collectiviteId: collectiviteId,
            nom: axisPath[axisPath.length - 1],
          },
          user
        );

        if (!axeId.success) {
          return failure(axeId.error);
        }

        axeIdsByPath.set(JSON.stringify(axisPath), axeId.data.id);
      }

      return success(axeIdsByPath);
    } catch (error) {
      return failure(
        `Error creating axes: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Create a new plan with all its axes and fiches
   */
  async createPlan(
    plan: PlanImport,
    collectiviteId: number,
    user: AuthenticatedUser,
    tx: Transaction
  ): Promise<Result<number, string>> {
    try {
      this.logger.log(
        `Creating plan ${plan.nom} for collectivité ${collectiviteId}`
      );

      // First create all fiches
      const ficheResults = await Promise.all(
        plan.fiches.map((fiche) => this.createFiche(fiche, collectiviteId, tx))
      );

      // Check for fiche creation errors
      const ficheError = ficheResults.find((result) => !result.success);
      if (ficheError) {
        return failure(ficheError.error);
      }

      // Create the plan
      const createPlanResult = await this.planService.createPlan(
        {
          collectiviteId,
          nom: plan.nom,
          typeId: plan.typeId,
          pilotes: plan.pilotes,
          referents: plan.referents,
        },
        user,
        tx
      );

      if ('error' in createPlanResult) {
        return failure(createPlanResult.error);
      }

      // Create axes from paths
      const axeResult = await this.createAxesFromPaths(
        plan.fiches.map((f) => f.axisPath),
        createPlanResult.data.id,
        collectiviteId,
        user,
        tx
      );

      if (!axeResult.success) {
        return failure(axeResult.error);
      }

      const axeIdsByPath = axeResult.data;

      // Link fiches to their axes
      for (const fiche of plan.fiches) {
        if (fiche.id && fiche.axisPath.length > 0) {
          const axeId = axeIdsByPath.get(JSON.stringify(fiche.axisPath));
          if (axeId) {
            // TODO: Add linkFicheToAxe to PlanService
            this.logger.warn(`Need to link fiche ${fiche.id} to axe ${axeId}`);
          }
        }
      }

      this.logger.log(`Successfully created plan ${plan.nom}`);
      return success(createPlanResult.data.id);
    } catch (error) {
      this.logger.error(`Error creating plan:`, error);
      return failure(
        `Error creating plan: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
