import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { PersonneId } from '@tet/domain/collectivites';
import { eq } from 'drizzle-orm';
import { UpsertAxeBaseRepository } from '../../axes/upsert-axe/upsert-axe-base.repository';
import { planPiloteTable } from '../../fiches/shared/models/plan-pilote.table';
import { planReferentTable } from '../../fiches/shared/models/plan-referent.table';
import { UpsertPlanError, UpsertPlanErrorEnum } from './upsert-plan.errors';
import { BaseCreatePlanInput, BaseUpdatePlanInput } from './upsert-plan.input';

@Injectable()
export class UpsertPlanRepository extends UpsertAxeBaseRepository<
  BaseCreatePlanInput,
  BaseUpdatePlanInput,
  UpsertPlanError
> {
  protected readonly logger = new Logger(UpsertPlanRepository.name);

  constructor(databaseService: DatabaseService) {
    super(databaseService);
  }

  protected getCreateError(): UpsertPlanError {
    return UpsertPlanErrorEnum.CREATE_PLAN_ERROR;
  }

  protected getUpdateError(): UpsertPlanError {
    return UpsertPlanErrorEnum.UPDATE_PLAN_ERROR;
  }

  /**
   * Met à jour les relations entre un plan et ses référents
   * @param planId identifiant du plan
   * @param referents liste des référents à associer
   * @param userId identifiant de l'utilisateur
   * @param tx transaction
   */
  async setReferents(
    planId: number,
    referents: PersonneId[] | null,
    userId: string,
    tx: Transaction
  ): Promise<Result<undefined, UpsertPlanError>> {
    try {
      // Supprime toutes les relations existantes liées au plan
      await tx
        .delete(planReferentTable)
        .where(eq(planReferentTable.planId, planId));

      // Ajoute les nouvelles relations
      if (referents && referents.length > 0) {
        await tx
          .insert(planReferentTable)
          .values(
            referents.map((referent) => ({
              planId,
              tagId: referent.tagId,
              userId: referent.userId,
              createdBy: userId,
              createdAt: new Date().toISOString(),
            }))
          )
          .returning();
      }

      return { success: true, data: undefined };
    } catch (error) {
      this.logger.error(`Error updating plan ${planId} referents: ${error}`);
      return {
        success: false,
        error: UpsertPlanErrorEnum.UPDATE_REFERENTS_ERROR,
      };
    }
  }

  /**
   * Met à jour les relations entre un plan et ses pilotes
   * @param planId identifiant du plan
   * @param pilotes liste des pilotes à associer
   * @param userId identifiant de l'utilisateur
   * @param tx transaction
   */
  async setPilotes(
    planId: number,
    pilotes: PersonneId[] | null,
    userId: string,
    tx: Transaction
  ): Promise<Result<undefined, UpsertPlanError>> {
    try {
      // Supprime toutes les relations existantes liées au plan
      await tx
        .delete(planPiloteTable)
        .where(eq(planPiloteTable.planId, planId));

      // Ajoute les nouvelles relations
      if (pilotes && pilotes.length > 0) {
        await tx
          .insert(planPiloteTable)
          .values(
            pilotes.map((pilote) => ({
              planId,
              tagId: pilote.tagId,
              userId: pilote.userId,
              createdBy: userId,
              createdAt: new Date().toISOString(),
            }))
          )
          .returning();
      }

      return { success: true, data: undefined };
    } catch (error) {
      this.logger.error(`Error updating plan ${planId} pilotes: ${error}`);
      return {
        success: false,
        error: UpsertPlanErrorEnum.UPDATE_PILOTES_ERROR,
      };
    }
  }
}
