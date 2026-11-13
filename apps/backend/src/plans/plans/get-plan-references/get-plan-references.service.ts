import { Injectable } from '@nestjs/common';
import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
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
    if (
      !(await this.getPlanService.checkPermission(
        plan.collectiviteId,
        user,
        tx
      ))
    ) {
      return failure(PlanErrorType.UNAUTHORIZED);
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

    const readableIds = await this.listReadableFicheIds(planId, { user, tx });
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
  ): Promise<number[]> {
    const { data: racines } = await this.listFichesService.listFichesQuery(
      null,
      { planActionIds: [planId] },
      { limit: 'all' },
      tx
    );
    const readableIds: number[] = [];
    let fiches = racines;
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
      const children = await this.listFichesService.listFichesQuery(
        null,
        { parentsId: parentIds },
        { limit: 'all' },
        tx
      );
      fiches = children.data;
    }
    return readableIds;
  }
}
