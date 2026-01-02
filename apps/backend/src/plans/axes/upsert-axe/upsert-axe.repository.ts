import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { MethodResult } from '@tet/backend/utils/result.type';
import { eq } from 'drizzle-orm';
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
   * @param tx transaction
   */
  async setIndicateurs(
    axeId: number,
    indicateurs: { id: number }[] | null,
    tx: Transaction
  ): Promise<MethodResult<undefined, UpsertAxeError>> {
    try {
      // Supprime toutes les relations existantes liées à l'axe
      await tx
        .delete(axeIndicateurTable)
        .where(eq(axeIndicateurTable.axeId, axeId));

      // Ajoute les nouvelles relations
      if (indicateurs && indicateurs.length > 0) {
        await tx
          .insert(axeIndicateurTable)
          .values(
            indicateurs.map((indicateur) => ({
              axeId,
              indicateurId: indicateur.id,
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
