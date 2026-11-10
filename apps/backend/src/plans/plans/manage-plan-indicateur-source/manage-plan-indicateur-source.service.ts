import { Injectable, Logger } from '@nestjs/common';
import { IndicateurLockRepository } from '@tet/backend/indicateurs/indicateur/indicateur-lock.repository';
import IndicateurSourcesService from '@tet/backend/indicateurs/sources/indicateur-sources.service';
import { ListIndicateurValeursService } from '@tet/backend/indicateurs/valeurs/list-indicateur-valeurs/list-indicateur-valeurs.service';
import { ReconcileIndicateurValeursService } from '@tet/backend/indicateurs/valeurs/reconcile-indicateur-valeurs/reconcile-indicateur-valeurs.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  isFailedResult,
  TransactionManager,
  TransactionOperation,
} from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  INDICATEUR_SOURCES_WITH_DEDICATED_METADATA,
  IndicateurSourceMetadonnee,
} from '@tet/domain/indicateurs';
import { ResourceType } from '@tet/domain/users';
import { GetPlanRepository } from '../get-plan/get-plan.repository';
import { GetPlanService } from '../get-plan/get-plan.service';
import { UpsertPlanRepository } from '../upsert-plan/upsert-plan.repository';
import {
  CreatePlanIndicateurSourceInput,
  FillMissingPlanIndicateurValeursInput,
  ListPlanIndicateurValeursInput,
  PlanIndicateurSourceContext,
  PlanIndicateurSourceError,
  PlanIndicateurSourceScope,
} from './manage-plan-indicateur-source.types';

type LockedPlanSource = {
  collectiviteId: number;
  metadonnee: IndicateurSourceMetadonnee | null;
};

/** Accède à la source exacte d'un plan, sans exposer d'autorisation réutilisable. */
@Injectable()
export class ManagePlanIndicateurSourceService {
  private readonly logger = new Logger(ManagePlanIndicateurSourceService.name);

  constructor(
    private readonly getPlanRepository: GetPlanRepository,
    private readonly upsertPlanRepository: UpsertPlanRepository,
    private readonly getPlanService: GetPlanService,
    private readonly sources: IndicateurSourcesService,
    private readonly values: ListIndicateurValeursService,
    private readonly reconciliation: ReconcileIndicateurValeursService,
    private readonly indicateurLocks: IndicateurLockRepository,
    private readonly permissions: PermissionService,
    private readonly transactions: TransactionManager
  ) {}

  getOrCreate(
    { planId, source, metadonnee }: CreatePlanIndicateurSourceInput,
    context: PlanIndicateurSourceContext
  ): Promise<Result<IndicateurSourceMetadonnee, PlanIndicateurSourceError>> {
    return this.execute(context, async (tx) => {
      // La création peut être suivie de valeurs sous cette même transaction.
      await this.indicateurLocks.lockForValueWrite(tx);
      const locked = await this.lockSource(
        { planId, sourceId: source.id },
        'update',
        { user: context.user, tx }
      );
      if (!locked.success) return locked;
      if (locked.data.metadonnee) return success(locked.data.metadonnee);

      await this.sources.upsertIndicateurSource(source, tx);
      const created = await this.sources.createIndicateurSourceMetadonnee(
        { ...metadonnee, sourceId: source.id },
        tx
      );
      if (!created) return failure('DATABASE_ERROR');
      const attached =
        await this.upsertPlanRepository.attachIndicateurSourceMetadonnee(
          {
            planId,
            collectiviteId: locked.data.collectiviteId,
            metadonneeId: created.id,
          },
          tx
        );
      return attached ? success(created) : failure('NOT_FOUND');
    });
  }

  get(
    scope: PlanIndicateurSourceScope,
    context: PlanIndicateurSourceContext
  ): Promise<
    Result<IndicateurSourceMetadonnee | null, PlanIndicateurSourceError>
  > {
    return this.execute(context, async (tx) => {
      const locked = await this.lockSource(scope, 'share', {
        user: context.user,
        tx,
      });
      return locked.success ? success(locked.data.metadonnee) : locked;
    });
  }

  listValeurs(
    { planId, sourceId, ...filters }: ListPlanIndicateurValeursInput,
    context: PlanIndicateurSourceContext
  ) {
    return this.execute(context, async (tx) => {
      const locked = await this.lockSource({ planId, sourceId }, 'share', {
        user: context.user,
        tx,
      });
      if (!locked.success) return locked;
      if (!locked.data.metadonnee) return failure('NOT_FOUND');
      return this.values.list(
        {
          ...filters,
          collectiviteId: locked.data.collectiviteId,
          metadonneeId: locked.data.metadonnee.id,
          sources: [sourceId],
        },
        { user: context.user, tx }
      );
    });
  }

  fillMissing(
    { planId, sourceId, valeurs }: FillMissingPlanIndicateurValeursInput,
    context: PlanIndicateurSourceContext
  ) {
    return this.execute(context, async (tx) => {
      // Même ordre que les liens d'indicateurs : graphe avant axes et valeurs.
      await this.indicateurLocks.lockForValueWrite(tx);
      const locked = await this.lockSource({ planId, sourceId }, 'update', {
        user: context.user,
        tx,
      });
      if (!locked.success) return locked;
      const { collectiviteId, metadonnee } = locked.data;
      if (!metadonnee) return failure('NOT_FOUND');
      const metadataAuthorization = {
        collectiviteId,
        metadonneeId: metadonnee.id,
        sourceId: metadonnee.sourceId,
      };
      return this.reconciliation.fillMissing(
        valeurs.map((valeur) => ({
          ...valeur,
          collectiviteId,
          metadonneeId: metadonnee.id,
        })),
        { user: context.user, metadataAuthorization, tx }
      );
    });
  }

  private async lockSource(
    { planId, sourceId }: PlanIndicateurSourceScope,
    mode: 'share' | 'update',
    { user, tx }: PlanIndicateurSourceContext & { tx: Transaction }
  ): Promise<Result<LockedPlanSource, PlanIndicateurSourceError>> {
    if (
      !Number.isSafeInteger(planId) ||
      planId <= 0 ||
      !INDICATEUR_SOURCES_WITH_DEDICATED_METADATA.includes(sourceId)
    ) {
      return failure('INVALID_VALUE');
    }
    const plan = await this.getPlanRepository.lockPlan(planId, mode, tx);
    if (!plan) return failure('NOT_FOUND');

    if (mode === 'share') {
      const canReadPlan = await this.getPlanService.checkPermission(
        plan.collectiviteId,
        user,
        tx
      );
      if (!canReadPlan) return failure('UNAUTHORIZED');
    } else {
      const planAccess = await this.permissions.isAllowed(
        user,
        'plans.mutate',
        ResourceType.COLLECTIVITE,
        { collectiviteId: plan.collectiviteId },
        tx
      );
      if (!planAccess.success) return failure('UNAUTHORIZED');
      const valuesAccess = await this.permissions.isAllowed(
        user,
        'indicateurs.valeurs.mutate',
        ResourceType.COLLECTIVITE,
        { collectiviteId: plan.collectiviteId },
        tx
      );
      if (!valuesAccess.success) return failure('UNAUTHORIZED');
    }

    const metadonnee =
      plan.indicateurSourceMetadonneeId === null
        ? null
        : await this.sources.lockIndicateurSourceMetadonnee(
            plan.indicateurSourceMetadonneeId,
            tx
          );
    if (
      metadonnee === undefined ||
      (metadonnee && metadonnee.sourceId !== sourceId)
    ) {
      return failure('INVALID_VALUE');
    }
    return success({ collectiviteId: plan.collectiviteId, metadonnee });
  }

  private execute<T>(
    context: PlanIndicateurSourceContext,
    operation: TransactionOperation<T, PlanIndicateurSourceError>
  ): Promise<Result<T, PlanIndicateurSourceError>> {
    return this.transactions.executeSingle(async (tx) => {
      try {
        return await operation(tx);
      } catch (error) {
        if (isFailedResult<PlanIndicateurSourceError>(error)) return error;
        this.logger.error('Impossible de gérer la source du plan', error);
        return failure(
          'DATABASE_ERROR',
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }, context.tx);
  }
}
