import { Injectable, Logger } from '@nestjs/common';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { PersonneId } from '@tet/domain/collectivites';
import { eq, sql } from 'drizzle-orm';
import { UpsertAxeBaseRepository } from '../../axes/upsert-axe/upsert-axe-base.repository';
import { axeTable } from '../../fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '../../fiches/shared/models/fiche-action-axe.table';
import { planPiloteTable } from '../../fiches/shared/models/plan-pilote.table';
import { planReferentTable } from '../../fiches/shared/models/plan-referent.table';
import { UpsertPlanError, UpsertPlanErrorEnum } from './upsert-plan.errors';
import { BaseCreatePlanInput, BaseUpdatePlanInput } from './upsert-plan.input';

export type PlanAxeLookup = {
  id: number;
  parent: number | null;
  collectiviteId: number;
};

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

  async findPlanAxe(
    planId: number,
    tx?: Transaction
  ): Promise<PlanAxeLookup | null> {
    const [row] = await (tx ?? this.databaseService.db)
      .select({
        id: axeTable.id,
        parent: axeTable.parent,
        collectiviteId: axeTable.collectiviteId,
      })
      .from(axeTable)
      .where(eq(axeTable.id, planId))
      .limit(1);
    return row ?? null;
  }

  // modifiedBy/modifiedAt positionnés ici car le trigger SQL
  // `set_modified_by_before_fiche_action` utilise `auth.uid()`, null sous
  // connexion Drizzle.
  async setRestreintForPlanFiches(
    {
      planId,
      restreint,
      modifiedBy,
    }: {
      planId: number;
      restreint: boolean;
      modifiedBy: string;
    },
    tx?: Transaction
  ): Promise<void> {
    const db = tx ?? this.databaseService.db;
    const planFicheIds = db
      .selectDistinct({ ficheId: ficheActionAxeTable.ficheId })
      .from(ficheActionAxeTable)
      .innerJoin(axeTable, eq(ficheActionAxeTable.axeId, axeTable.id))
      .where(eq(axeTable.plan, planId));

    await db
      .update(ficheActionTable)
      .set({
        restreint,
        modifiedBy,
        modifiedAt: sql`now()`,
      })
      .where(sql`${ficheActionTable.id} IN ${planFicheIds}`);
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

  /**
   * Lie un plan racine au panier dont il est issu en écrivant `axe.panier_id`.
   * Utilisé par le checkout panier pour la traçabilité plan ← panier.
   */
  async linkToPanier(
    planId: number,
    panierId: string,
    tx?: Transaction
  ): Promise<Result<undefined, UpsertPlanError>> {
    try {
      const updated = await (tx ?? this.databaseService.db)
        .update(axeTable)
        .set({ panierId })
        .where(eq(axeTable.id, planId))
        .returning({ id: axeTable.id });

      if (updated.length === 0) {
        this.logger.error(
          `linkToPanier : axe ${planId} introuvable lors de la mise à jour de panier_id`
        );
        return {
          success: false,
          error: UpsertPlanErrorEnum.UPDATE_PLAN_ERROR,
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      this.logger.error(`Error linking plan ${planId} to panier ${panierId}: ${error}`);
      return {
        success: false,
        error: UpsertPlanErrorEnum.UPDATE_PLAN_ERROR,
      };
    }
  }
}
