import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { MethodResult } from '@tet/backend/utils/result.type';
import { eq } from 'drizzle-orm';
import { axeIndicateurTable } from '../../fiches/shared/models/axe-indicateur.table';
import { MutateAxeBaseRepository } from './mutate-axe-base.repository';
import { MutateAxeError, MutateAxeErrorEnum } from './mutate-axe.errors';
import { CreateAxeInput, UpdateAxeInput } from './mutate-axe.input';

@Injectable()
export class MutateAxeRepository extends MutateAxeBaseRepository<
  CreateAxeInput,
  UpdateAxeInput,
  MutateAxeError
> {
  protected readonly logger = new Logger(MutateAxeRepository.name);

  constructor(databaseService: DatabaseService) {
    super(databaseService);
  }

  protected getCreateError(): MutateAxeError {
    return MutateAxeErrorEnum.CREATE_AXE_ERROR;
  }

  protected getUpdateError(): MutateAxeError {
    return MutateAxeErrorEnum.UPDATE_AXE_ERROR;
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
  ): Promise<MethodResult<undefined, MutateAxeError>> {
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
        error: MutateAxeErrorEnum.UPDATE_INDICATEURS_ERROR,
      };
    }
  }
}
