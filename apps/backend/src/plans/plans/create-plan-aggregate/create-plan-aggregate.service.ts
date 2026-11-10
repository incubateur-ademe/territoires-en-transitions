import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { AddAnnexeService } from '@tet/backend/plans/fiches/add-annexe/add-annexe.service';
import { CreateFicheService } from '@tet/backend/plans/fiches/create-fiche/create-fiche.service';
import { FicheCreateAuthorization } from '@tet/backend/plans/fiches/create-fiche/fiche-create-authorization';
import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import { FicheActionRepository } from '@tet/backend/plans/fiches/fiche-action.repository';
import { FicheSecteursAttributionRepository } from '@tet/backend/plans/fiches/fiche-secteurs/fiche-secteurs-attribution.repository';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { isFailedResult } from '@tet/backend/utils/transaction/transaction-manager.service';
import { WebhookService } from '@tet/backend/utils/webhooks/webhook.service';
import { ApplicationSousScopesEnum } from '@tet/domain/utils';
import { eq } from 'drizzle-orm';
import { axeTable } from '../../fiches/shared/models/axe.table';
import { ficheActionTable } from '../../fiches/shared/models/fiche-action.table';
import { UpsertAxeError } from '../../axes/upsert-axe/upsert-axe.errors';
import { UpsertAxeService } from '../../axes/upsert-axe/upsert-axe.service';
import { PlanError, PlanErrorType } from '../plans.errors';
import { UpsertPlanError } from '../upsert-plan/upsert-plan.errors';
import { PlanCreateAuthorization } from '../upsert-plan/plan-create-authorization';
import { UpsertPlanService } from '../upsert-plan/upsert-plan.service';
import { PlanAggregateStructure } from './create-plan-aggregate.rules';
import { PreparedPlanReferences } from './plan-aggregate-references.rules';
import {
  AggregateAxe,
  AggregateFiche,
  CreatePlanAggregateInput,
  CreatePlanAggregateOutput,
} from './create-plan-aggregate.types';

interface CreationContext extends CreatePlanAggregateOutput {
  collectiviteId: number;
  user: AuthenticatedUser;
  authorization: FicheCreateAuthorization;
  tx: Transaction;
}

/** La cause Postgres suffit aux journaux, sans requête ni paramètres Drizzle. */
function toFailureCause(error: unknown): Error {
  if (isFailedResult(error)) {
    return error.cause ?? toFailureCause(error.error);
  }
  if (error instanceof Error) {
    return error.cause instanceof Error ? error.cause : error;
  }
  return new Error(String(error));
}

/** Crée le plan et ses relations sous la transaction de l'appelant. */
@Injectable()
export class CreatePlanAggregateService {
  private readonly logger = new Logger(CreatePlanAggregateService.name);

  constructor(
    private readonly upsertAxeService: UpsertAxeService,
    private readonly upsertPlanService: UpsertPlanService,
    private readonly createFicheService: CreateFicheService,
    private readonly listFichesService: ListFichesService,
    private readonly permissionService: PermissionService,
    private readonly webhookService: WebhookService,
    private readonly ficheSecteursAttributionRepository: FicheSecteursAttributionRepository,
    private readonly fichePermissions: FicheActionPermissionsService,
    private readonly ficheRepository: FicheActionRepository,
    private readonly addAnnexeService: AddAnnexeService
  ) {}

  /** Un échec doit faire annuler la transaction englobante par son propriétaire. */
  async create(
    request: CreatePlanAggregateInput,
    requestContext: {
      user: AuthenticatedUser;
      tx: Transaction;
      planCreateAuthorization?: PlanCreateAuthorization;
    }
  ): Promise<
    Result<
      CreatePlanAggregateOutput,
      PlanError | UpsertAxeError | UpsertPlanError
    >
  > {
    const { user, tx } = requestContext;
    const structure = PlanAggregateStructure.validateAndSort(request);
    if (!structure.success) {
      return failure(PlanErrorType.INVALID_DATA, new Error(structure.error));
    }

    try {
      const authorization = await FicheCreateAuthorization.forCollectivite(
        this.permissionService,
        user,
        request.collectiviteId,
        tx
      );
      for (const { ficheId } of request.existingFiches ?? []) {
        if (
          !(await this.fichePermissions.canLinkFicheToCollectivite(
            ficheId,
            request.collectiviteId,
            user,
            tx
          ))
        )
          return failure(PlanErrorType.UNAUTHORIZED);
      }

      const plan = await this.upsertPlanService.upsertPlan(
        {
          id: request.planId,
          collectiviteId: request.collectiviteId,
          nom: request.nom,
          typeId: request.typeId,
          dateDebut: request.dateDebut,
          dateFin: request.dateFin,
          pilotes: request.pilotes,
          referents: request.referents,
        },
        requestContext
      );
      if (!plan.success) return plan;

      const context: CreationContext = {
        planId: plan.data.id,
        axeIdsBySourceKey: new Map(),
        ficheIdsBySourceKey: new Map(),
        createdFicheIds: [],
        collectiviteId: request.collectiviteId,
        user,
        tx,
        authorization,
      };
      for (const axe of structure.data.axes) {
        const result = await this.createAxe(axe, context);
        if (!result.success) return result;
      }
      for (const fiche of structure.data.fiches) {
        const result = await this.createFiche(fiche, context);
        if (!result.success) return result;
      }
      for (const fiche of request.existingFiches ?? []) {
        const axeId = this.resolveAxeId(fiche.axeSourceKey, context);
        const result = await this.ficheRepository.addAxeLinks(
          fiche.ficheId,
          [axeId],
          user.id,
          tx
        );
        if (!result.success) {
          return failure(
            PlanErrorType.DATABASE_ERROR,
            toFailureCause(result.cause ?? result.error)
          );
        }
        context.ficheIdsBySourceKey.set(fiche.sourceKey, fiche.ficheId);
      }

      await this.saveCreatedReferences(structure.data.references, context);

      return success({
        planId: context.planId,
        axeIdsBySourceKey: context.axeIdsBySourceKey,
        ficheIdsBySourceKey: context.ficheIdsBySourceKey,
        createdFicheIds: context.createdFicheIds,
      });
    } catch (error) {
      if (error instanceof ForbiddenException)
        return failure(PlanErrorType.UNAUTHORIZED);
      this.logger.error('Error creating plan:', error);
      return failure(PlanErrorType.DATABASE_ERROR, toFailureCause(error));
    }
  }

  /** À appeler seulement après le commit englobant. Un échec ne relance pas la création. */
  async notifyCreatedFiches({
    createdFicheIds,
    planId,
  }: Pick<
    CreatePlanAggregateOutput,
    'createdFicheIds' | 'planId'
  >): Promise<void> {
    if (createdFicheIds.length === 0) return;
    try {
      const { data: fiches } = await this.listFichesService.listFichesQuery(
        null,
        { ficheIds: createdFicheIds, withChildren: true }
      );
      await this.webhookService.sendWebhookNotifications(
        ApplicationSousScopesEnum.FICHES,
        fiches.map((fiche) => ({ entityId: `${fiche.id}`, payload: fiche }))
      );
    } catch (error) {
      this.logger.error(
        `[Import plan ${planId}] Webhook batch notification failed`,
        error instanceof Error ? error.stack : error
      );
    }
  }

  private async createAxe(
    axe: AggregateAxe,
    context: CreationContext
  ): Promise<Result<void, UpsertAxeError>> {
    const result = await this.upsertAxeService.upsertAxe(
      {
        planId: context.planId,
        parent: this.resolveAxeId(axe.parentSourceKey, context),
        collectiviteId: context.collectiviteId,
        nom: axe.nom,
      },
      { user: context.user, tx: context.tx }
    );
    if (!result.success) return result;
    context.axeIdsBySourceKey.set(axe.sourceKey, result.data.id);
    return success(undefined);
  }

  private async createFiche(
    input: AggregateFiche,
    context: CreationContext
  ): Promise<Result<void, PlanError>> {
    const axeId = this.resolveAxeId(input.axeSourceKey, context);
    const parentId =
      input.parentSourceKey === undefined
        ? null
        : context.ficheIdsBySourceKey.get(input.parentSourceKey);
    const result = await this.createFicheService.createFicheWithAuthorization({
      authorization: context.authorization,
      fiche: {
        ...input.fiche,
        collectiviteId: context.collectiviteId,
        parentId,
        tempsDeMiseEnOeuvre: input.fiche.tempsDeMiseEnOeuvre?.id ?? null,
      },
      ficheFields: { ...input.fiche, axes: [{ id: axeId }] },
      tx: context.tx,
    });
    if (!result.success) {
      return failure(
        PlanErrorType.DATABASE_ERROR,
        toFailureCause(result.cause ?? result.error)
      );
    }
    context.ficheIdsBySourceKey.set(input.sourceKey, result.data.id);
    context.createdFicheIds.push(result.data.id);
    if (input.documents?.length) {
      const annexes = await this.addAnnexeService.insertAnnexes(
        input.documents.map(({ titre, url }) => ({
          ficheId: result.data.id,
          collectiviteId: context.collectiviteId,
          titre,
          url,
          commentaire: '',
          modifiedBy: context.user.id,
        })),
        context.tx
      );
      if (!annexes.success)
        return failure(
          PlanErrorType.DATABASE_ERROR,
          toFailureCause(annexes.cause ?? annexes.error)
        );
    }
    if (input.secteursProposes) {
      await this.ficheSecteursAttributionRepository.createFromImportIa(
        {
          ficheId: result.data.id,
          ...input.secteursProposes,
          modifiedBy: context.user.id,
        },
        context.tx
      );
    }
    return success(undefined);
  }

  private resolveAxeId(
    sourceKey: string | undefined,
    context: CreationContext
  ): number {
    if (sourceKey === undefined) return context.planId;
    const axeId = context.axeIdsBySourceKey.get(sourceKey);
    // La validation et l'ordre de création garantissent cette correspondance.
    if (axeId === undefined) throw new Error(`Axe non créé : ${sourceKey}`);
    return axeId;
  }

  private async saveCreatedReferences(
    references: PreparedPlanReferences,
    context: CreationContext
  ): Promise<void> {
    const { tx } = context;
    if (references.engagements) {
      await tx
        .update(axeTable)
        .set({
          referenceProgramme: references.engagements.programme,
          engagementsCodes: references.engagements.codes,
        })
        .where(eq(axeTable.id, context.planId));
    }
    for (const { sourceKey, reference } of references.axes) {
      await tx
        .update(axeTable)
        .set({
          referenceProgramme: reference.programme,
          referenceCode: reference.code,
        })
        .where(eq(axeTable.id, this.resolveAxeId(sourceKey, context)));
    }
    for (const { sourceKey, reference } of references.fiches) {
      const ficheId = context.ficheIdsBySourceKey.get(sourceKey);
      if (ficheId === undefined)
        throw new Error(`Fiche non créée : ${sourceKey}`);
      await tx
        .update(ficheActionTable)
        .set({
          referenceProgramme: reference.programme,
          referenceCode: reference.code,
          referenceKind: reference.kind,
          referenceParentCode: reference.parentCode ?? null,
        })
        .where(eq(ficheActionTable.id, ficheId));
    }
  }
}
