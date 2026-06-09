import { Injectable, Logger } from '@nestjs/common';
import { AddAnnexeService } from '@tet/backend/plans/fiches/add-annexe/add-annexe.service';
import { CreateFicheService } from '@tet/backend/plans/fiches/create-fiche/create-fiche.service';
import { FicheCreateAuthorization } from '@tet/backend/plans/fiches/create-fiche/fiche-create-authorization';
import { FicheActionBudgetService } from '@tet/backend/plans/fiches/fiche-action-budget/fiche-action-budget.service';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { Personne, PersonneId } from '@tet/domain/collectivites';
import { FicheWithRelations, Plan } from '@tet/domain/plans';
import { UpsertAxeService } from '../../axes/upsert-axe/upsert-axe.service';
import { GetPlanError, GetPlanErrorEnum } from '../get-plan/get-plan.errors';
import { GetPlanService } from '../get-plan/get-plan.service';
import { UpsertPlanErrorEnum } from '../upsert-plan/upsert-plan.errors';
import { UpsertPlanService } from '../upsert-plan/upsert-plan.service';
import { DuplicatePlanError, DuplicatePlanErrorEnum } from './duplicate-plan.errors';
import { DuplicatePlanInput } from './duplicate-plan.input';
import {
  AxeIdRemapping,
  mapSourceFicheToDuplicate,
} from './duplicated-fiche.mapper';
import { mapSourceFicheAnnexes } from './duplicated-fiche-annexes.mapper';
import { mapSourceFicheBudgets } from './duplicated-fiche-budgets.mapper';
import { buildDuplicatedPlanName } from './duplicated-plan-name';

const toPersonneId = (personne: Personne): PersonneId => ({
  tagId: personne.tagId,
  userId: personne.userId,
});

const getPlanErrorToDuplicateError = (
  error: GetPlanError
): DuplicatePlanError => {
  if (error === GetPlanErrorEnum.UNAUTHORIZED) {
    return DuplicatePlanErrorEnum.UNAUTHORIZED;
  }
  if (error === GetPlanErrorEnum.PLAN_NOT_FOUND) {
    return DuplicatePlanErrorEnum.PLAN_NOT_FOUND;
  }
  return DuplicatePlanErrorEnum.DUPLICATE_PLAN_ERROR;
};

const ownedByCollectivite = (
  fiches: FicheWithRelations[],
  collectiviteId: number
): FicheWithRelations[] =>
  fiches.filter((fiche) => fiche.collectiviteId === collectiviteId);

type PlanFichesToDuplicate = {
  actions: FicheWithRelations[];
  sousActions: FicheWithRelations[];
};

@Injectable()
export class DuplicatePlanService {
  private readonly logger = new Logger(DuplicatePlanService.name);

  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly permissionService: PermissionService,
    private readonly getPlanService: GetPlanService,
    private readonly listFichesService: ListFichesService,
    private readonly upsertPlanService: UpsertPlanService,
    private readonly upsertAxeService: UpsertAxeService,
    private readonly createFicheService: CreateFicheService,
    private readonly ficheBudgetService: FicheActionBudgetService,
    private readonly addAnnexeService: AddAnnexeService
  ) {}

  async duplicate(
    { planId }: DuplicatePlanInput,
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<Result<{ planId: number }, DuplicatePlanError>> {
    return this.transactionManager.executeSingle<
      { planId: number },
      DuplicatePlanError
    >(async (transaction) => {
      const sourceResult = await this.getPlanService.getPlan(
        { planId },
        user,
        transaction
      );
      if (!sourceResult.success) {
        return failure(getPlanErrorToDuplicateError(sourceResult.error));
      }
      const source = sourceResult.data;
      const { collectiviteId } = source;

      const authorizationResult = await this.buildWriteAuthorization(
        user,
        collectiviteId,
        transaction
      );
      if (!authorizationResult.success) return authorizationResult;
      const authorization = authorizationResult.data;

      const planFiches = await this.loadPlanFiches(
        planId,
        collectiviteId,
        transaction
      );

      const newPlanResult = await this.upsertPlanService.upsertPlan(
        {
          collectiviteId,
          nom: buildDuplicatedPlanName(source.nom, new Date()),
          typeId: source.type?.id ?? undefined,
          pilotes: source.pilotes.map(toPersonneId),
          referents: source.referents.map(toPersonneId),
        },
        user,
        transaction
      );
      if (!newPlanResult.success) {
        return failure(
          newPlanResult.error === UpsertPlanErrorEnum.UNAUTHORIZED
            ? DuplicatePlanErrorEnum.UNAUTHORIZED
            : DuplicatePlanErrorEnum.DUPLICATE_PLAN_ERROR
        );
      }
      const newPlanId = newPlanResult.data.id;

      const axeIdRemappingResult = await this.recreateAxes({
        source,
        newPlanId,
        collectiviteId,
        user,
        tx: transaction,
      });
      if (!axeIdRemappingResult.success) return axeIdRemappingResult;

      const fichesResult = await this.recreateFiches({
        actions: planFiches.actions,
        sousActions: planFiches.sousActions,
        authorization,
        collectiviteId,
        axeIdRemapping: axeIdRemappingResult.data,
        tx: transaction,
      });
      if (!fichesResult.success) return fichesResult;

      const ficheCount =
        planFiches.actions.length + planFiches.sousActions.length;
      this.logger.log(
        `Plan ${planId} dupliqué vers ${newPlanId} (${ficheCount} fiches) pour la collectivité ${collectiviteId}`
      );
      return success({ planId: newPlanId });
    }, tx);
  }

  private async loadPlanFiches(
    planId: number,
    collectiviteId: number,
    tx: Transaction
  ): Promise<PlanFichesToDuplicate> {
    const { data: matchedActions } =
      await this.listFichesService.listFichesQuery(
        collectiviteId,
        { planActionIds: [planId] },
        undefined,
        tx
      );
    const actions = ownedByCollectivite(matchedActions, collectiviteId);

    const actionIds = actions.map((fiche) => fiche.id);
    if (actionIds.length === 0) return { actions, sousActions: [] };

    const { data: matchedChildren } =
      await this.listFichesService.listFichesQuery(
        collectiviteId,
        { parentsId: actionIds },
        undefined,
        tx
      );

    return { actions, sousActions: ownedByCollectivite(matchedChildren, collectiviteId) };
  }

  private async buildWriteAuthorization(
    user: AuthenticatedUser,
    collectiviteId: number,
    tx: Transaction
  ): Promise<Result<FicheCreateAuthorization, DuplicatePlanError>> {
    try {
      const authorization = await FicheCreateAuthorization.forCollectivite(
        this.permissionService,
        user,
        collectiviteId,
        tx
      );
      return success(authorization);
    } catch (error) {
      this.logger.warn(
        `Duplication refusée sur la collectivité ${collectiviteId}: ${
          error instanceof Error ? error.message : error
        }`
      );
      return failure(DuplicatePlanErrorEnum.UNAUTHORIZED);
    }
  }

  private async recreateAxes({
    source,
    newPlanId,
    collectiviteId,
    user,
    tx,
  }: {
    source: Plan;
    newPlanId: number;
    collectiviteId: number;
    user: AuthenticatedUser;
    tx: Transaction;
  }): Promise<Result<AxeIdRemapping, DuplicatePlanError>> {
    const remapping = new Map<number, number>([[source.id, newPlanId]]);

    const childAxesByDepth = source.axes
      .filter((axe) => axe.id !== source.id)
      .sort((first, second) => first.depth - second.depth);

    for (const axe of childAxesByDepth) {
      const parentNewId =
        axe.parent === null ? newPlanId : remapping.get(axe.parent);
      if (parentNewId === undefined) {
        return failure(DuplicatePlanErrorEnum.DUPLICATE_PLAN_ERROR);
      }

      const createdAxe = await this.upsertAxeService.upsertAxe(
        { planId: newPlanId, parent: parentNewId, collectiviteId, nom: axe.nom },
        user,
        tx
      );
      if (!createdAxe.success) {
        return failure(DuplicatePlanErrorEnum.DUPLICATE_PLAN_ERROR);
      }
      remapping.set(axe.id, createdAxe.data.id);
    }

    return success(remapping);
  }

  private async recreateFiches({
    actions,
    sousActions,
    authorization,
    collectiviteId,
    axeIdRemapping,
    tx,
  }: {
    actions: FicheWithRelations[];
    sousActions: FicheWithRelations[];
    authorization: FicheCreateAuthorization;
    collectiviteId: number;
    axeIdRemapping: AxeIdRemapping;
    tx: Transaction;
  }): Promise<Result<undefined, DuplicatePlanError>> {
    const ficheIdRemapping = new Map<number, number>();

    for (const source of actions) {
      const created = await this.duplicateFiche({
        source,
        collectiviteId,
        parentId: null,
        authorization,
        axeIdRemapping,
        tx,
      });
      if (!created.success) return created;
      ficheIdRemapping.set(source.id, created.data);
    }

    for (const source of sousActions) {
      const parentId =
        source.parentId === null
          ? undefined
          : ficheIdRemapping.get(source.parentId);
      if (parentId === undefined) {
        return failure(DuplicatePlanErrorEnum.DUPLICATE_PLAN_ERROR);
      }

      const created = await this.duplicateFiche({
        source,
        collectiviteId,
        parentId,
        authorization,
        axeIdRemapping,
        tx,
      });
      if (!created.success) return created;
      ficheIdRemapping.set(source.id, created.data);
    }

    return success(undefined);
  }

  private async duplicateFiche({
    source,
    collectiviteId,
    parentId,
    authorization,
    axeIdRemapping,
    tx,
  }: {
    source: FicheWithRelations;
    collectiviteId: number;
    parentId: number | null;
    authorization: FicheCreateAuthorization;
    axeIdRemapping: AxeIdRemapping;
    tx: Transaction;
  }): Promise<Result<number, DuplicatePlanError>> {
    const { fiche, ficheFields } = mapSourceFicheToDuplicate({
      source,
      collectiviteId,
      parentId,
      axeIdRemapping,
    });

    const created = await this.createFicheService.createFicheWithAuthorization({
      authorization,
      fiche,
      ficheFields,
      tx,
    });
    if (!created.success) {
      return failure(DuplicatePlanErrorEnum.DUPLICATE_PLAN_ERROR);
    }
    const newFicheId = created.data.id;

    const budgetsResult = await this.copyBudgets(source, newFicheId, tx);
    if (!budgetsResult.success) return budgetsResult;

    const annexesResult = await this.copyAnnexes({
      source,
      newFicheId,
      modifiedBy: authorization.user.id,
      tx,
    });
    if (!annexesResult.success) return annexesResult;

    return success(newFicheId);
  }

  private async copyAnnexes({
    source,
    newFicheId,
    modifiedBy,
    tx,
  }: {
    source: FicheWithRelations;
    newFicheId: number;
    modifiedBy: string;
    tx: Transaction;
  }): Promise<Result<undefined, DuplicatePlanError>> {
    const sourceAnnexes =
      await this.addAnnexeService.loadRawAnnexesForDuplication(
        source.id,
        source.collectiviteId,
        tx
      );
    const annexes = mapSourceFicheAnnexes(sourceAnnexes, {
      newFicheId,
      collectiviteId: source.collectiviteId,
      modifiedBy,
    });
    const result = await this.addAnnexeService.insertAnnexes(annexes, tx);
    if (!result.success) {
      return failure(DuplicatePlanErrorEnum.DUPLICATE_PLAN_ERROR);
    }
    return success(undefined);
  }

  private async copyBudgets(
    source: FicheWithRelations,
    newFicheId: number,
    tx: Transaction
  ): Promise<Result<undefined, DuplicatePlanError>> {
    const budgets = mapSourceFicheBudgets(source, newFicheId);
    const result = await this.ficheBudgetService.insertBudgets(budgets, tx);
    if (!result.success) {
      return failure(DuplicatePlanErrorEnum.DUPLICATE_PLAN_ERROR);
    }
    return success(undefined);
  }
}
