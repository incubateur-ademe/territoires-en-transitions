import { DatabaseService } from '@/backend/utils/database/database.service';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { MethodResult } from '@/backend/utils/result.type';
import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { axeIndicateurTable } from '../../fiches/shared/models/axe-indicateur.table';
import { axeTable, AxeType } from '../../fiches/shared/models/axe.table';
import { MutateAxeError, MutateAxeErrorEnum } from './mutate-axe.errors';
import { CreateAxeInput, UpdateAxeInput } from './mutate-axe.input';

@Injectable()
export class MutateAxeRepository {
  private readonly logger = new Logger(MutateAxeRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    axe: CreateAxeInput,
    userId: string,
    tx?: Transaction
  ): Promise<MethodResult<AxeType, MutateAxeError>> {
    try {
      const result = await (tx ?? this.databaseService.db)
        .insert(axeTable)
        .values({
          ...axe,
          modifiedBy: userId,
          modifiedAt: new Date().toISOString(),
        })
        .returning();

      if (!result || result.length === 0) {
        return {
          success: false,
          error: MutateAxeErrorEnum.CREATE_AXE_ERROR,
        };
      }

      const [createdAxe] = result;
      return {
        success: true,
        data: createdAxe,
      };
    } catch (error) {
      this.logger.error(`Error creating axe: ${error}`);
      return {
        success: false,
        error: MutateAxeErrorEnum.CREATE_AXE_ERROR,
      };
    }
  }

  async update(
    axe: UpdateAxeInput,
    userId: string,
    tx?: Transaction
  ): Promise<MethodResult<AxeType, MutateAxeError>> {
    try {
      const { id: axeId, ...otherProps } = axe;
      const result = await (tx ?? this.databaseService.db)
        .update(axeTable)
        .set({
          ...otherProps,
          modifiedBy: userId,
          modifiedAt: new Date().toISOString(),
        })
        .where(eq(axeTable.id, axeId))
        .returning();

      if (!result || result.length === 0) {
        return {
          success: false,
          error: MutateAxeErrorEnum.UPDATE_AXE_ERROR,
        };
      }

      const [updatedAxe] = result;
      return {
        success: true,
        data: updatedAxe,
      };
    } catch (error) {
      this.logger.error(`Error updating axe ${axe?.id}: ${error}`);
      return {
        success: false,
        error: MutateAxeErrorEnum.UPDATE_AXE_ERROR,
      };
    }
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
