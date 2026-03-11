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
  getActionKey,
  validatePlanAggregate,
} from './create-plan-aggregate.rule';
import {
  CreatePlanAggregateInput,
  FicheWithRelationsAndAxisPath,
} from './create-plan-aggregate.types';

type SousActionFiche = FicheWithRelationsAndAxisPath & {
  parentActionTitre: string;
};

interface CreationContext {
  axeIdsByPath: Map<string, number>;
  planId: number;
  collectiviteId: number;
  user: AuthenticatedUser;
  tx: Transaction;
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

/**
 * Orchestrates the creation of a complete plan aggregate:
 * plan (root axe), hierarchical axes, and fiches with proper linkage.
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
        allAxisPaths,
        request.fiches
      );

      if (!aggregateValidation.isValid) {
        const details = aggregateValidation.errors.join(', ');
        this.logger.warn(`Plan aggregate validation failed: ${details}`);
        return failure(PlanErrorType.INVALID_DATA, new Error(details));
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
      if (!createPlanResult.success) return createPlanResult;

      const axeResult = await this.createAxesFromPaths({
        paths: allAxisPaths,
        planId: createPlanResult.data.id,
        collectiviteId: request.collectiviteId,
        user,
        tx,
      });
      if (!axeResult.success) return axeResult;

      const ctx: CreationContext = {
        axeIdsByPath: axeResult.data,
        planId: createPlanResult.data.id,
        collectiviteId: request.collectiviteId,
        user,
        tx,
      };

      const normalFiches = request.fiches.filter((f) => !f.parentActionTitre);
      const sousActions = request.fiches.filter(
        (f): f is SousActionFiche => !!f.parentActionTitre
      );

      const createdFiche = await this.createActionFiches({
        fiches: normalFiches,
        ctx,
      });
      if (!createdFiche.success) return createdFiche;

      const sousActionsResult = await this.createSousActionFiches({
        sousActions,
        parentIdByKey: createdFiche.data,
        ctx,
      });
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

  private async createAxesFromPaths({
    paths,
    planId,
    collectiviteId,
    user,
    tx,
  }: {
    paths: string[][];
    planId: number;
    collectiviteId: number;
    user: AuthenticatedUser;
    tx: Transaction;
  }): Promise<Result<Map<string, number>, PlanError | UpsertAxeError>> {
    const axesToCreate = extractUniqueAxes(paths);

    return axesToCreate.reduce<
      Promise<Result<Map<string, number>, PlanError | UpsertAxeError>>
    >(async (accPromise, axe) => {
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
    }, Promise.resolve(success(new Map<string, number>())));
  }

  private async createActionFiches({
    fiches,
    ctx,
  }: {
    fiches: FicheWithRelationsAndAxisPath[];
    ctx: CreationContext;
  }): Promise<Result<Map<string, number>, PlanError>> {
    const results = await Promise.all(
      fiches.map(async (ficheWithPath) => {
        const result = await this.createOneFiche({ ficheWithPath, ctx });
        if (!result.success) return result;
        return success({ ficheWithPath, id: result.data.id });
      })
    );

    const combined = combineResults(results);
    if (!combined.success) return failure(PlanErrorType.DATABASE_ERROR);

    const parentIdByKey = combined.data.reduce((acc, { ficheWithPath, id }) => {
      if (ficheWithPath.fiche.titre) {
        acc.set(
          getActionKey(ficheWithPath.fiche.titre, ficheWithPath.axisPath),
          id
        );
      }
      return acc;
    }, new Map<string, number>());
    return success(parentIdByKey);
  }

  private async createSousActionFiches({
    sousActions,
    parentIdByKey,
    ctx,
  }: {
    sousActions: SousActionFiche[];
    parentIdByKey: Map<string, number>;
    ctx: CreationContext;
  }): Promise<Result<void, PlanError>> {
    const results = await Promise.all(
      sousActions.map((ficheWithPath) => {
        const parentId = parentIdByKey.get(
          getActionKey(ficheWithPath.parentActionTitre, ficheWithPath.axisPath)
        );
        if (parentId === undefined)
          return failure(PlanErrorType.DATABASE_ERROR);
        return this.createOneFiche({ ficheWithPath, ctx, parentId });
      })
    );

    const combined = combineResults(results);
    if (!combined.success) return failure(PlanErrorType.DATABASE_ERROR);
    return success(undefined);
  }

  private async createOneFiche({
    ficheWithPath,
    ctx,
    parentId,
  }: {
    ficheWithPath: FicheWithRelationsAndAxisPath;
    ctx: CreationContext;
    parentId?: number;
  }): Promise<Result<{ id: number }, PlanError>> {
    const axeId = resolveAxeId(
      ficheWithPath.axisPath,
      ctx.axeIdsByPath,
      ctx.planId
    );
    const ficheToCreate = buildFicheCreate(
      ficheWithPath.fiche,
      ctx.collectiviteId,
      parentId
    );

    const result = await this.createFicheService.createFiche(ficheToCreate, {
      ficheFields: {
        ...ficheWithPath.fiche,
        axes: axeId ? [{ id: axeId }] : undefined,
      },
      user: ctx.user,
      tx: ctx.tx,
    });

    if (!result.success) return failure(PlanErrorType.DATABASE_ERROR);
    return success({ id: result.data.id });
  }
}
