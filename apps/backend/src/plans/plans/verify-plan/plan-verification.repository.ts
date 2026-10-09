import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { PlanSourceEnum, PlanStatus, PlanStatusEnum } from '@tet/domain/plans';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { axeTable } from '../../fiches/shared/models/axe.table';
import { VerifyPlanError, VerifyPlanErrorEnum } from './verify-plan.errors';

/**
 * Origine, statut et vérification humaine d'un plan, portés par son axe
 * racine : importing → to_verify (ou failed) → active.
 */
@Injectable()
export class PlanVerificationRepository {
  private readonly logger = new Logger(PlanVerificationRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /** Plan créé au lancement de l'import IA, vide jusqu'à la fin du job. */
  async markAsImporting(
    planId: number,
    tx?: Transaction
  ): Promise<Result<void, VerifyPlanError>> {
    return this.setStatus({
      planId,
      set: {
        source: PlanSourceEnum.IMPORT_IA,
        status: PlanStatusEnum.IMPORTING,
      },
      tx,
    });
  }

  async markAsImportedByAi(
    planId: number,
    tx?: Transaction
  ): Promise<Result<void, VerifyPlanError>> {
    return this.setStatus({
      planId,
      set: {
        source: PlanSourceEnum.IMPORT_IA,
        status: PlanStatusEnum.TO_VERIFY,
      },
      fromStatus: PlanStatusEnum.IMPORTING,
      tx,
    });
  }

  async markAsImportFailed(
    planId: number,
    tx?: Transaction
  ): Promise<Result<void, VerifyPlanError>> {
    return this.setStatus({
      planId,
      set: { status: PlanStatusEnum.FAILED },
      fromStatus: PlanStatusEnum.IMPORTING,
      tx,
    });
  }

  /** Plan d'un import qui n'a jamais démarré : il n'a ni axe ni fiche. */
  async deleteImportingPlan(
    planId: number,
    tx?: Transaction
  ): Promise<Result<void, VerifyPlanError>> {
    try {
      await (tx ?? this.databaseService.db)
        .delete(axeTable)
        .where(
          and(
            eq(axeTable.id, planId),
            isNull(axeTable.parent),
            eq(axeTable.status, PlanStatusEnum.IMPORTING)
          )
        );
      return success(undefined);
    } catch (error) {
      this.logger.error(
        `Suppression du plan en import ${planId} : ${getErrorMessage(error)}`
      );
      return failure(VerifyPlanErrorEnum.VERIFY_PLAN_ERROR);
    }
  }

  private async setStatus({
    planId,
    set,
    fromStatus,
    tx,
  }: {
    planId: number;
    set: Pick<typeof axeTable.$inferInsert, 'source' | 'status'>;
    fromStatus?: PlanStatus;
    tx?: Transaction;
  }): Promise<Result<void, VerifyPlanError>> {
    try {
      const [row] = await (tx ?? this.databaseService.db)
        .update(axeTable)
        .set(set)
        .where(
          and(
            eq(axeTable.id, planId),
            isNull(axeTable.parent),
            fromStatus ? eq(axeTable.status, fromStatus) : undefined
          )
        )
        .returning({ id: axeTable.id });
      return row
        ? success(undefined)
        : failure(VerifyPlanErrorEnum.PLAN_NOT_FOUND);
    } catch (error) {
      this.logger.error(
        `Passage du plan ${planId} au statut ${set.status} : ${getErrorMessage(
          error
        )}`
      );
      return failure(VerifyPlanErrorEnum.VERIFY_PLAN_ERROR);
    }
  }

  /**
   * Première vérification seulement : une seconde validation ne réécrit ni la
   * date ni l'auteur de la première.
   */
  async markAsVerified(
    { planId, userId }: { planId: number; userId: string },
    tx?: Transaction
  ): Promise<Result<{ verifiedAt: string } | null, VerifyPlanError>> {
    try {
      const [row] = await (tx ?? this.databaseService.db)
        .update(axeTable)
        .set({
          verifiedAt: sql`now()`,
          verifiedBy: userId,
          status: PlanStatusEnum.ACTIVE,
        })
        .where(
          and(
            eq(axeTable.id, planId),
            isNull(axeTable.parent),
            eq(axeTable.status, PlanStatusEnum.TO_VERIFY)
          )
        )
        .returning({ verifiedAt: axeTable.verifiedAt });
      return success(row?.verifiedAt ? { verifiedAt: row.verifiedAt } : null);
    } catch (error) {
      this.logger.error(
        `Vérification du plan ${planId} : ${getErrorMessage(error)}`
      );
      return failure(VerifyPlanErrorEnum.VERIFY_PLAN_ERROR);
    }
  }
}
