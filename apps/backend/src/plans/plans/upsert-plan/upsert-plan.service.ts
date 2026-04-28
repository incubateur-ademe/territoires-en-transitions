import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { AxeLight } from '@tet/domain/plans';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { PlanIndexerService } from '../plan-indexer/plan-indexer.service';
import { UpsertPlanError, UpsertPlanErrorEnum } from './upsert-plan.errors';
import {
  baseCreatePlanSchema,
  baseUpdatePlanSchema,
  UpsertPlanInput,
} from './upsert-plan.input';
import { UpsertPlanRepository } from './upsert-plan.repository';

@Injectable()
export class UpsertPlanService {
  private readonly logger = new Logger(UpsertPlanService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly upsertPlanRepository: UpsertPlanRepository,
    private readonly databaseService: DatabaseService,
    private readonly planIndexerService: PlanIndexerService
  ) {}

  async upsertPlan(
    plan: UpsertPlanInput,
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<Result<AxeLight, UpsertPlanError>> {
    const isAllowed = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['PLANS.MUTATE'],
      ResourceType.COLLECTIVITE,
      plan.collectiviteId,
      true,
      tx
    );
    if (!isAllowed) {
      return {
        success: false,
        error: UpsertPlanErrorEnum.UNAUTHORIZED,
      };
    }

    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<Result<AxeLight, UpsertPlanError>> => {
      const { referents, pilotes, ...planProps } = plan;
      const updatePlanProps = baseUpdatePlanSchema.safeParse(planProps);

      let result;
      if (updatePlanProps.success) {
        result = await this.upsertPlanRepository.update(
          updatePlanProps.data,
          user.id,
          transaction
        );
      } else {
        const createPlanProps = baseCreatePlanSchema.safeParse(planProps);
        if (createPlanProps.success) {
          result = await this.upsertPlanRepository.create(
            createPlanProps.data,
            user.id,
            transaction
          );
        } else {
          this.logger.log(
            `Parsing error detected into input: ${createPlanProps.error}`
          );
        }
      }

      if (!result?.success) {
        return (
          result || {
            success: false,
            error: UpsertPlanErrorEnum.CREATE_PLAN_ERROR,
          }
        );
      }

      // Met à jour les référents liés
      if (referents !== undefined) {
        const setReferentsResult = await this.upsertPlanRepository.setReferents(
          result.data.id,
          referents,
          user.id,
          transaction
        );
        if (!setReferentsResult.success) {
          return setReferentsResult;
        }
      }

      // Met à jour les pilotes liés
      if (pilotes !== undefined) {
        const setPilotesResult = await this.upsertPlanRepository.setPilotes(
          result.data.id,
          pilotes ?? null,
          user.id,
          transaction
        );
        if (!setPilotesResult.success) {
          return setPilotesResult;
        }
      }

      return { success: true, data: result.data };
    };

    // Utiliser la transaction fournie ou en créer une nouvelle
    const result = await (tx
      ? executeInTransaction(tx)
      : this.databaseService.db.transaction(async (newTx) =>
          executeInTransaction(newTx)
        ));

    // Indexation Meilisearch : on enfile l'upsert APRÈS le commit (ou après
    // l'exécution dans la transaction parente) pour ne jamais indexer un état
    // qui sera rollbacké. L'enqueue est wrappé dans un try/catch + warn :
    // une panne BullMQ ne doit pas faire échouer la requête utilisateur — la
    // dérive est rattrapée par le backfill admin (U8). Mêmes garanties que
    // le webhook post-commit dans `update-fiche.service.ts`.
    if (result.success) {
      try {
        await this.planIndexerService.enqueueUpsert(result.data.id);
      } catch (err) {
        this.logger.warn(
          `Échec de l'enqueue d'indexation pour le plan ${result.data.id} : ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }

    return result;
  }

  async setFichesPrivate({
    planId,
    isPrivate,
    user,
    tx,
  }: {
    planId: number;
    isPrivate: boolean;
    user: AuthenticatedUser;
    tx?: Transaction;
  }): Promise<Result<undefined, UpsertPlanError>> {
    const axe = await this.upsertPlanRepository.findPlanAxe(planId, tx);
    if (!axe) {
      return { success: false, error: UpsertPlanErrorEnum.PLAN_NOT_FOUND };
    }
    if (axe.parent !== null) {
      return { success: false, error: UpsertPlanErrorEnum.NOT_A_PLAN };
    }

    const isAllowed = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['PLANS.MUTATE'],
      ResourceType.COLLECTIVITE,
      axe.collectiviteId,
      true,
      tx
    );
    if (!isAllowed) {
      return {
        success: false,
        error: UpsertPlanErrorEnum.UNAUTHORIZED,
      };
    }

    await this.upsertPlanRepository.setRestreintForPlanFiches(
      { planId, restreint: isPrivate, modifiedBy: user.id },
      tx
    );

    return { success: true, data: undefined };
  }

  async linkToPanier(
    planId: number,
    panierId: string,
    tx?: Transaction
  ): Promise<Result<undefined, UpsertPlanError>> {
    return this.upsertPlanRepository.linkToPanier(planId, panierId, tx);
  }
}
