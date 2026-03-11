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
import {
  CreatePlanAggregateInput,
  FicheWithRelationsAndAxisPath,
} from './create-plan-aggregate.types';

type SousActionFiche = FicheWithRelationsAndAxisPath & {
  parentActionTitre: string;
};

function parentKey(titre: string, axisPath?: string[]): string {
  return `${axisFormatter.serialize(axisPath ?? [])}::${titre}`;
}

function resolveAxeId(
  axisPath: string[] | undefined,
  axeIdsByPath: Map<string, number>,
  planId: number
): number | undefined {
  return axisPath
    ? axeIdsByPath.get(axisFormatter.serialize(axisPath))
    : planId;
}

function buildFicheCreate(
  fiche: FicheWithRelationsAndAxisPath['fiche'],
  collectiviteId: number,
  parentId?: number
): FicheCreate {
  return {
    ...fiche,
    collectiviteId,
    tempsDeMiseEnOeuvre: fiche.tempsDeMiseEnOeuvre?.id ?? null,
    ...(parentId !== undefined ? { parentId } : {}),
  };
}

function extractUniqueParents(
  fiches: FicheWithRelationsAndAxisPath[]
): FicheWithRelationsAndAxisPath[] {
  return fiches
    .filter((f): f is SousActionFiche => !!f.parentActionTitre)
    .reduce<{ seen: Set<string>; parents: FicheWithRelationsAndAxisPath[] }>(
      (acc, ficheWithPath) => {
        const key = parentKey(
          ficheWithPath.parentActionTitre,
          ficheWithPath.axisPath
        );
        if (acc.seen.has(key)) return acc;
        acc.seen.add(key);
        acc.parents.push({
          axisPath: ficheWithPath.axisPath,
          fiche: { ...ficheWithPath.fiche, titre: ficheWithPath.parentActionTitre },
        });
        return acc;
      },
      { seen: new Set<string>(), parents: [] }
    ).parents;
}

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
          `Plan aggregate validation failed: ${aggregateValidation.errors.join(', ')}`
        );
        return failure(PlanErrorType.INVALID_DATA);
      }

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
      if (!createPlanResult.success) return createPlanResult;

      const axeResult = await this.createAxesFromPaths(
        allAxisPaths,
        createPlanResult.data.id,
        request.collectiviteId,
        user,
        tx
      );
      if (!axeResult.success) return axeResult;

      const normalFiches = request.fiches.filter((f) => !f.parentActionTitre);
      const autoParents = extractUniqueParents(request.fiches);
      const sousActions = request.fiches.filter(
        (f): f is SousActionFiche => !!f.parentActionTitre
      );

      const pass1Result = await this.createActionFiches(
        [...normalFiches, ...autoParents],
        axeResult.data,
        createPlanResult.data.id,
        request.collectiviteId,
        user,
        tx
      );
      if (!pass1Result.success) return pass1Result;

      const sousActionsResult = await this.createSousActionFiches(
        sousActions,
        pass1Result.data,
        axeResult.data,
        createPlanResult.data.id,
        request.collectiviteId,
        user,
        tx
      );
      if (!sousActionsResult.success) return sousActionsResult;

      this.logger.log(
        `Successfully created plan ${request.nom} (ID: ${createPlanResult.data.id})`
      );
      return success(createPlanResult.data.id);
    } catch (error) {
      this.logger.error(`Error creating plan:`, error);
      return failure(PlanErrorType.DATABASE_ERROR);
    }
  }

  private async createAxesFromPaths(
    paths: string[][],
    planId: number,
    collectiviteId: number,
    user: AuthenticatedUser,
    tx: Transaction
  ): Promise<Result<Map<string, number>, PlanError | UpsertAxeError>> {
    const axesToCreate = extractUniqueAxes(paths);

    return axesToCreate.reduce<
      Promise<Result<Map<string, number>, PlanError | UpsertAxeError>>
    >(
      async (accPromise, axe) => {
        const acc = await accPromise;
        if (!acc.success) return acc;

        const parentIdResult = findParentAxeId(axe.path, acc.data, planId);
        if (!parentIdResult.success) return parentIdResult;

        const nom = axe.path[axe.path.length - 1];
        const createdAxe = await this.upsertAxeService.upsertAxe(
          { planId, parent: parentIdResult.data, collectiviteId, nom },
          user,
          tx
        );
        if (!createdAxe.success) return createdAxe;

        acc.data.set(axe.fullPath, createdAxe.data.id);
        return acc;
      },
      Promise.resolve(success(new Map<string, number>()))
    );
  }

  private async createActionFiches(
    fiches: FicheWithRelationsAndAxisPath[],
    axeIdsByPath: Map<string, number>,
    planId: number,
    collectiviteId: number,
    user: AuthenticatedUser,
    tx: Transaction
  ): Promise<Result<Map<string, number>, PlanError>> {
    return fiches.reduce<Promise<Result<Map<string, number>, PlanError>>>(
      async (accPromise, ficheWithPath) => {
        const acc = await accPromise;
        if (!acc.success) return acc;

        const result = await this.createOneFiche(
          ficheWithPath,
          axeIdsByPath,
          planId,
          collectiviteId,
          user,
          tx
        );
        if (!result.success) return result;

        if (ficheWithPath.fiche.titre) {
          acc.data.set(
            parentKey(ficheWithPath.fiche.titre, ficheWithPath.axisPath),
            result.data.id
          );
        }
        return acc;
      },
      Promise.resolve(success(new Map<string, number>()))
    );
  }

  private async createSousActionFiches(
    sousActions: SousActionFiche[],
    parentIdByKey: Map<string, number>,
    axeIdsByPath: Map<string, number>,
    planId: number,
    collectiviteId: number,
    user: AuthenticatedUser,
    tx: Transaction
  ): Promise<Result<void, PlanError>> {
    const results = await Promise.all(
      sousActions.map((ficheWithPath) => {
        const parentId = parentIdByKey.get(
          parentKey(ficheWithPath.parentActionTitre, ficheWithPath.axisPath)
        );
        if (parentId === undefined) return failure(PlanErrorType.DATABASE_ERROR);
        return this.createOneFiche(
          ficheWithPath,
          axeIdsByPath,
          planId,
          collectiviteId,
          user,
          tx,
          parentId
        );
      })
    );

    const combined = combineResults(results);
    if (!combined.success) return failure(PlanErrorType.DATABASE_ERROR);
    return success(undefined);
  }

  private async createOneFiche(
    ficheWithPath: FicheWithRelationsAndAxisPath,
    axeIdsByPath: Map<string, number>,
    planId: number,
    collectiviteId: number,
    user: AuthenticatedUser,
    tx: Transaction,
    parentId?: number
  ): Promise<Result<{ id: number }, PlanError>> {
    const axeId = resolveAxeId(ficheWithPath.axisPath, axeIdsByPath, planId);
    const ficheToCreate = buildFicheCreate(
      ficheWithPath.fiche,
      collectiviteId,
      parentId
    );

    const result = await this.createFicheService.createFiche(ficheToCreate, {
      ficheFields: {
        ...ficheWithPath.fiche,
        axes: axeId ? [{ id: axeId }] : undefined,
      },
      user,
      tx,
    });

    if (!result.success) return failure(PlanErrorType.DATABASE_ERROR);
    return success({ id: result.data.id });
  }
}
