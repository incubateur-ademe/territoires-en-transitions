import { Logger } from '@nestjs/common';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { AxeLight } from '@tet/domain/plans';
import { eq } from 'drizzle-orm';

/**
 * Type d'erreur générique pour les opérations d'upsert
 */
export type UpsertError = string;

/**
 * Classe de base abstraite pour les repositories d'upsert d'axes/plans
 * Factorise les méthodes communes create et update
 */
export abstract class UpsertAxeBaseRepository<
  TCreateInput extends { collectiviteId: number },
  TUpdateInput extends { id: number; collectiviteId: number },
  TError extends UpsertError
> {
  protected abstract readonly logger: Logger;

  constructor(protected readonly databaseService: DatabaseService) {}

  /**
   * Crée un axe ou un plan dans la base de données
   * @param input Données de création
   * @param userId Identifiant de l'utilisateur
   * @param tx Transaction optionnelle
   * @returns Résultat de la création
   */
  async create(
    input: TCreateInput,
    userId: string,
    tx?: Transaction
  ): Promise<Result<AxeLight, TError>> {
    try {
      const result = await (tx ?? this.databaseService.db)
        .insert(axeTable)
        .values({
          ...input,
          modifiedBy: userId,
          modifiedAt: new Date().toISOString(),
        })
        .returning();

      if (!result || result.length === 0) {
        return {
          success: false,
          error: this.getCreateError(),
        };
      }

      const [created] = result;
      return {
        success: true,
        data: created,
      };
    } catch (error) {
      this.logger.error(`Error creating: ${JSON.stringify(error)}`);
      return {
        success: false,
        error: this.getCreateError(),
      };
    }
  }

  /**
   * Met à jour un axe ou un plan dans la base de données
   * @param input Données de mise à jour
   * @param userId Identifiant de l'utilisateur
   * @param tx Transaction optionnelle
   * @returns Résultat de la mise à jour
   */
  async update(
    input: TUpdateInput,
    userId: string,
    tx?: Transaction
  ): Promise<Result<AxeLight, TError>> {
    try {
      const { id, ...otherProps } = input;
      const result = await (tx ?? this.databaseService.db)
        .update(axeTable)
        .set({
          ...otherProps,
          modifiedBy: userId,
          modifiedAt: new Date().toISOString(),
        })
        .where(eq(axeTable.id, id))
        .returning();

      if (!result || result.length === 0) {
        return {
          success: false,
          error: this.getUpdateError(),
        };
      }

      const [updated] = result;
      return {
        success: true,
        data: updated,
      };
    } catch (error) {
      this.logger.error(`Error updating ${input?.id}: ${error}`);
      return {
        success: false,
        error: this.getUpdateError(),
      };
    }
  }

  /**
   * Méthodes abstraites à implémenter dans les classes filles
   */
  protected abstract getCreateError(): TError;
  protected abstract getUpdateError(): TError;
}
