import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { and, eq, inArray } from 'drizzle-orm';
import { axeIndicateurTable } from '../../fiches/shared/models/axe-indicateur.table';
import { UpsertAxeBaseRepository } from './upsert-axe-base.repository';
import { UpsertAxeError, UpsertAxeErrorEnum } from './upsert-axe.errors';
import { BaseCreateAxeInput, BaseUpdateAxeInput } from './upsert-axe.input';

@Injectable()
export class UpsertAxeRepository extends UpsertAxeBaseRepository<
  BaseCreateAxeInput,
  BaseUpdateAxeInput,
  UpsertAxeError
> {
  protected readonly logger = new Logger(UpsertAxeRepository.name);

  constructor(databaseService: DatabaseService) {
    super(databaseService);
  }

  protected getCreateError(): UpsertAxeError {
    return UpsertAxeErrorEnum.CREATE_AXE_ERROR;
  }

  protected getUpdateError(): UpsertAxeError {
    return UpsertAxeErrorEnum.UPDATE_AXE_ERROR;
  }

  /**
   * Met à jour les relations entre un axe et ses indicateurs
   * @param axeId identifiant de l'axe
   * @param indicateurs liste des indicateurs à associer
   * @param userId identifiant de l'utilisateur à l'origine du changement
   * @param tx transaction
   *
   * Ne supprime/insère que les relations qui changent réellement, pour que
   * created_at/created_by des relations inchangées ne soient pas réinitialisés
   * à chaque sauvegarde de l'axe (et pour poser createdBy/modifiedBy sur les
   * relations effectivement créées, le défaut DB `auth.uid()` étant null sous
   * connexion Drizzle — cf upsert-plan.repository.ts:58-60).
   */
  async setAxeIndicateurs(
    axeId: number,
    indicateurs: { id: number }[] | null,
    userId: string,
    tx: Transaction
  ): Promise<Result<undefined, UpsertAxeError>> {
    try {
      const desiredIndicateurIds = new Set(
        (indicateurs ?? []).map((indicateur) => indicateur.id)
      );

      const existingRows = await tx
        .select({ indicateurId: axeIndicateurTable.indicateurId })
        .from(axeIndicateurTable)
        .where(eq(axeIndicateurTable.axeId, axeId));
      const existingIndicateurIds = new Set(
        existingRows.map((row) => row.indicateurId)
      );

      const indicateurIdsToDelete = existingRows
        .map((row) => row.indicateurId)
        .filter((id) => !desiredIndicateurIds.has(id));
      const indicateurIdsToInsert = [...desiredIndicateurIds].filter(
        (id) => !existingIndicateurIds.has(id)
      );

      if (indicateurIdsToDelete.length > 0) {
        await tx
          .delete(axeIndicateurTable)
          .where(
            and(
              eq(axeIndicateurTable.axeId, axeId),
              inArray(axeIndicateurTable.indicateurId, indicateurIdsToDelete)
            )
          );
      }

      if (indicateurIdsToInsert.length > 0) {
        await tx
          .insert(axeIndicateurTable)
          .values(
            indicateurIdsToInsert.map((indicateurId) => ({
              axeId,
              indicateurId,
              createdBy: userId,
              modifiedBy: userId,
            }))
          )
          .returning();
      }

      return { success: true, data: undefined };
    } catch (error) {
      this.logger.error(`Error updating axe ${axeId} indicateurs: ${error}`);
      return {
        success: false,
        error: UpsertAxeErrorEnum.UPDATE_INDICATEURS_ERROR,
      };
    }
  }
}
