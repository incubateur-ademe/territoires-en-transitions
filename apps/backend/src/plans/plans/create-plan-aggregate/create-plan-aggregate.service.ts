import { Injectable, Logger } from '@nestjs/common';
import { CreateFicheService } from '@tet/backend/plans/fiches/create-fiche/create-fiche.service';
import { FicheCreateAuthorization } from '@tet/backend/plans/fiches/create-fiche/fiche-create-authorization';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  combineResults,
  failure,
  Result,
  success,
} from '@tet/backend/utils/result.type';
import { WebhookService } from '@tet/backend/utils/webhooks/webhook.service';
import { FicheCreate } from '@tet/domain/plans';
import { ApplicationSousScopesEnum } from '@tet/domain/utils';
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
  authorization: FicheCreateAuthorization;
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
    private readonly upsertAxeService: UpsertAxeService,
    private readonly upsertPlanService: UpsertPlanService,
    private readonly createFicheService: CreateFicheService,
    private readonly listFichesService: ListFichesService,
    private readonly permissionService: PermissionService,
    private readonly webhookService: WebhookService
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

      const authorization = await FicheCreateAuthorization.forCollectivite(
        this.permissionService,
        user,
        request.collectiviteId,
        tx
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
        authorization,
        tx,
      };

      const normalFiches = request.fiches.filter((f) => !f.parentActionTitre);
      const sousActions = request.fiches.filter(
        (f): f is SousActionFiche => !!f.parentActionTitre
      );

      this.logger.log(
        `[Import plan ${createPlanResult.data.id}] Démarrage : ${normalFiches.length} actions et ${sousActions.length} sous-actions à créer`
      );
      const startedAt = Date.now();

      const createdFiche = await this.createActionFiches({
        fiches: normalFiches,
        ctx,
        planId: createPlanResult.data.id,
      });
      if (!createdFiche.success) return createdFiche;

      const sousActionsResult = await this.createSousActionFiches({
        sousActions,
        parentIdByKey: createdFiche.data.parentIdByKey,
        ctx,
        planId: createPlanResult.data.id,
      });
      if (!sousActionsResult.success) return sousActionsResult;

      const allFicheIds = [
        ...createdFiche.data.ficheIds,
        ...sousActionsResult.data.ficheIds,
      ];
      await this.notifyWebhooksBatched({
        ficheIds: allFicheIds,
        planId: createPlanResult.data.id,
        tx,
      });

      const durationSec = ((Date.now() - startedAt) / 1000).toFixed(1);
      this.logger.log(
        `[Import plan ${
          createPlanResult.data.id
        }] Terminé en ${durationSec}s : plan "${request.nom}" créé avec ${
          normalFiches.length + sousActions.length
        } fiches`
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

  /**
   * Recharge les fiches créées en une seule passe (1 query) et envoie un
   * webhook batched. Remplace les 209 refetch + 209 webhooks unitaires par
   * 1 + 1, ce qui élimine le N+1 de fin d'import.
   */
  private async notifyWebhooksBatched({
    ficheIds,
    planId,
    tx,
  }: {
    ficheIds: number[];
    planId: number;
    tx: Transaction;
  }): Promise<void> {
    if (ficheIds.length === 0) return;
    try {
      const { data: fiches } = await this.listFichesService.listFichesQuery(
        null,
        { ficheIds, withChildren: true },
        undefined,
        tx
      );
      await this.webhookService.sendWebhookNotifications(
        ApplicationSousScopesEnum.FICHES,
        fiches.map((fiche) => ({
          entityId: `${fiche.id}`,
          payload: fiche,
        }))
      );
    } catch (error) {
      this.logger.error(
        `[Import plan ${planId}] Webhook batch notification failed`,
        error instanceof Error ? error.stack : error
      );
    }
  }

  private logProgress(
    planId: number,
    label: string,
    done: number,
    total: number
  ): void {
    if (done === total || done % 10 === 0) {
      this.logger.log(`[Import plan ${planId}] ${label} ${done}/${total}`);
    }
  }

  private async createActionFiches({
    fiches,
    ctx,
    planId,
  }: {
    fiches: FicheWithRelationsAndAxisPath[];
    ctx: CreationContext;
    planId: number;
  }): Promise<
    Result<
      {
        parentIdByKey: Map<string, number>;
        ficheIds: number[];
      },
      PlanError
    >
  > {
    let done = 0;
    const results = await Promise.all(
      fiches.map(async (ficheWithPath) => {
        const result = await this.createOneFiche({ ficheWithPath, ctx });
        done += 1;
        this.logProgress(planId, 'action', done, fiches.length);
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
    const ficheIds = combined.data.map((entry) => entry.id);
    return success({ parentIdByKey, ficheIds });
  }

  private async createSousActionFiches({
    sousActions,
    parentIdByKey,
    ctx,
    planId,
  }: {
    sousActions: SousActionFiche[];
    parentIdByKey: Map<string, number>;
    ctx: CreationContext;
    planId: number;
  }): Promise<Result<{ ficheIds: number[] }, PlanError>> {
    let done = 0;
    const results = await Promise.all(
      sousActions.map(async (ficheWithPath) => {
        const parentId = parentIdByKey.get(
          getActionKey(ficheWithPath.parentActionTitre, ficheWithPath.axisPath)
        );
        if (parentId === undefined)
          return failure(PlanErrorType.DATABASE_ERROR);
        const result = await this.createOneFiche({
          ficheWithPath,
          ctx,
          parentId,
        });
        done += 1;
        this.logProgress(planId, 'sous-action', done, sousActions.length);
        return result;
      })
    );

    const combined = combineResults(results);
    if (!combined.success) return failure(PlanErrorType.DATABASE_ERROR);
    const ficheIds = combined.data.map((entry) => entry.id);
    return success({ ficheIds });
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

    const result = await this.createFicheService.createFicheWithAuthorization({
      authorization: ctx.authorization,
      fiche: ficheToCreate,
      ficheFields: {
        ...ficheWithPath.fiche,
        axes: axeId ? [{ id: axeId }] : undefined,
      },
      tx: ctx.tx,
    });
    if (!result.success) return failure(PlanErrorType.DATABASE_ERROR);

    return success({ id: result.data.id });
  }
}
