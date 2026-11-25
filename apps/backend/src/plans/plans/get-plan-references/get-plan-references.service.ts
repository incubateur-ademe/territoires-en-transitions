import { Injectable } from '@nestjs/common';
import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import { ListFichesQueryError } from '@tet/backend/plans/fiches/list-fiches/list-fiches.errors';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  axeReferenceSchema,
  ficheReferenceSchema,
  planEngagementsSchema,
  PlanReferences,
} from '@tet/domain/plans';
import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import { GetPlanRepository } from '../get-plan/get-plan.repository';
import { GetPlanService } from '../get-plan/get-plan.service';
import { PlanError, PlanErrorType } from '../plans.errors';

/** Lecture interne des identités métier, indépendante du job d'import. */
@Injectable()
export class GetPlanReferencesService {
  constructor(
    private readonly getPlanService: GetPlanService,
    private readonly getPlanRepository: GetPlanRepository,
    private readonly listFichesService: ListFichesService,
    private readonly fichePermissions: FicheActionPermissionsService
  ) {}

  async get(
    { planId }: { planId: number },
    context: { user: AuthenticatedUser; tx: Transaction }
  ): Promise<Result<PlanReferences, PlanError>> {
    try {
      return await this.read(planId, context);
    } catch (error) {
      return failure(
        PlanErrorType.DATABASE_ERROR,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private async read(
    planId: number,
    { user, tx }: { user: AuthenticatedUser; tx: Transaction }
  ): Promise<Result<PlanReferences, PlanError>> {
    const plan = await this.getPlanRepository.lockPlan(planId, 'share', tx);
    if (!plan) return failure(PlanErrorType.PLAN_NOT_FOUND);
    const permissionResult = await this.getPlanService.checkPermission(
      plan.collectiviteId,
      user,
      tx
    );
    if (!permissionResult.success) {
      // Le plan existe, donc sa collectivité aussi : seul un refus ou une panne reste.
      return failure(
        permissionResult.error === 'UNAUTHORIZED'
          ? PlanErrorType.UNAUTHORIZED
          : PlanErrorType.DATABASE_ERROR,
        permissionResult.cause
      );
    }

    const axes = await tx
      .select({
        axeId: axeTable.id,
        programme: axeTable.referenceProgramme,
        code: axeTable.referenceCode,
      })
      .from(axeTable)
      .where(
        and(
          eq(axeTable.plan, planId),
          eq(axeTable.collectiviteId, plan.collectiviteId),
          isNotNull(axeTable.referenceCode)
        )
      );

    const readableIdsResult = await this.listReadableFicheIds(planId, {
      user,
      tx,
    });
    if (!readableIdsResult.success) return readableIdsResult;
    const readableIds = readableIdsResult.data;
    const ficheReferences = readableIds.length
      ? await tx
          .select({
            ficheId: ficheActionTable.id,
            programme: ficheActionTable.referenceProgramme,
            kind: ficheActionTable.referenceKind,
            code: ficheActionTable.referenceCode,
            parentCode: ficheActionTable.referenceParentCode,
          })
          .from(ficheActionTable)
          .where(
            and(
              inArray(ficheActionTable.id, readableIds),
              eq(ficheActionTable.deleted, false),
              isNotNull(ficheActionTable.referenceCode)
            )
          )
      : [];

    return success({
      planId,
      engagements:
        plan.referenceProgramme === null
          ? null
          : planEngagementsSchema.parse({
              programme: plan.referenceProgramme,
              codes: plan.engagementsCodes,
            }),
      axes: axes.map(({ axeId, ...reference }) => ({
        axeId,
        reference: axeReferenceSchema.parse(reference),
      })),
      fiches: ficheReferences.map(({ ficheId, ...reference }) => ({
        ficheId,
        reference: ficheReferenceSchema.parse(reference),
      })),
    });
  }

  private async listReadableFicheIds(
    planId: number,
    { user, tx }: { user: AuthenticatedUser; tx: Transaction }
  ): Promise<Result<number[], ListFichesQueryError>> {
    const racinesResult = await this.listFichesService.listFichesQuery(
      {
        collectiviteId: null,
        filters: { planActionIds: [planId] },
        queryOptions: { limit: 'all' },
      },
      { tx }
    );
    if (!racinesResult.success) return racinesResult;
    const readableIds: number[] = [];
    let fiches = racinesResult.data.data;
    while (fiches.length) {
      const parentIds: number[] = [];
      for (const fiche of fiches) {
        if (
          await this.fichePermissions.canReadFicheObject(fiche, user, true, tx)
        ) {
          parentIds.push(fiche.id);
          readableIds.push(fiche.id);
        }
      }
      if (parentIds.length === 0) break;
      // Une sous-action suit sa parente actuelle, même sans lien d'axe propre.
      // Une parente supprimée, détachée ou non lisible exclut ses descendants.
      const childrenResult = await this.listFichesService.listFichesQuery(
        {
          collectiviteId: null,
          filters: { parentsId: parentIds },
          queryOptions: { limit: 'all' },
        },
        { tx }
      );
      if (!childrenResult.success) return childrenResult;
      fiches = childrenResult.data.data;
    }
    return success(readableIds);
  }
}
