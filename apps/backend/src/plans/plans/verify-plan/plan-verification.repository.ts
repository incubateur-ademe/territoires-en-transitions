import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { PlanSourceEnum } from '@tet/domain/plans';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { axeTable } from '../../fiches/shared/models/axe.table';
import { VerifyPlanError, VerifyPlanErrorEnum } from './verify-plan.errors';

/** Origine et vérification humaine d'un plan, portées par son axe racine. */
@Injectable()
export class PlanVerificationRepository {
  private readonly logger = new Logger(PlanVerificationRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async markAsImportedByAi(
    planId: number,
    tx?: Transaction
  ): Promise<Result<void, VerifyPlanError>> {
    try {
      const [row] = await (tx ?? this.databaseService.db)
        .update(axeTable)
        .set({ source: PlanSourceEnum.IMPORT_IA })
        .where(and(eq(axeTable.id, planId), isNull(axeTable.parent)))
        .returning({ id: axeTable.id });
      return row
        ? success(undefined)
        : failure(VerifyPlanErrorEnum.PLAN_NOT_FOUND);
    } catch (error) {
      this.logger.error(
        `Marquage du plan ${planId} comme importé : ${getErrorMessage(error)}`
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
        .set({ verifiedAt: sql`now()`, verifiedBy: userId })
        .where(
          and(
            eq(axeTable.id, planId),
            isNull(axeTable.parent),
            eq(axeTable.source, PlanSourceEnum.IMPORT_IA),
            isNull(axeTable.verifiedAt)
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
