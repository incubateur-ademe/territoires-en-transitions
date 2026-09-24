import { Injectable, Logger } from '@nestjs/common';
import { buildConflictUpdateColumns } from '@tet/backend/utils/database/conflict.utils';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq, inArray, SQL } from 'drizzle-orm';
import { isErrorWithCause } from '../../utils/nest/errors.utils';
import { PgIntegrityConstraintViolation } from '../../utils/postgresql-error-codes.enum';
import { actionStatutTable } from '../models/action-statut.table';
import {
  UpdateActionStatutError,
  UpdateActionStatutErrorEnum,
} from './update-action-statut.errors';

export type ActionStatutRow = typeof actionStatutTable.$inferSelect;
// `modifiedAt` est élargi à une expression SQL : l'appelant y met
// `CURRENT_TIMESTAMP` pour dater l'écriture côté base
export type ActionStatutRowToUpsert = Omit<
  typeof actionStatutTable.$inferInsert,
  'modifiedAt'
> & { modifiedAt?: string | SQL };

/** Statut écrit, accompagné de la ligne qu'il remplace (`null` à la création) */
export type UpsertedActionStatut = {
  current: ActionStatutRow;
  previous: ActionStatutRow | null;
};

@Injectable()
export class UpdateActionStatutRepository {
  private readonly logger = new Logger(UpdateActionStatutRepository.name);

  /**
   * Écrit les statuts d'une collectivité et renvoie, pour chacun, la ligne
   * écrite et celle qu'elle remplace.
   *
   * Les lignes existantes sont verrouillées (`for update`) avant l'écriture :
   * l'historique construit par l'appelant a besoin d'un état précédent stable.
   */
  async upsertStatuts(
    collectiviteId: number,
    actionStatuts: ActionStatutRowToUpsert[],
    tx: Transaction
  ): Promise<Result<UpsertedActionStatut[], UpdateActionStatutError>> {
    try {
      // trie les action IDs pour éviter les deadlocks lors du verrouillage de plusieurs lignes
      const sortedActionStatuts = [...actionStatuts].sort((a, b) =>
        a.actionId.localeCompare(b.actionId)
      );
      const sortedActionIds = sortedActionStatuts.map((a) => a.actionId);

      const previousRows = await tx
        .select()
        .from(actionStatutTable)
        .where(
          and(
            eq(actionStatutTable.collectiviteId, collectiviteId),
            inArray(actionStatutTable.actionId, sortedActionIds)
          )
        )
        .orderBy(actionStatutTable.actionId)
        .for('update');

      const previousByActionId = new Map(
        previousRows.map((row) => [row.actionId, row])
      );

      const upsertedRows = await tx
        .insert(actionStatutTable)
        .values(sortedActionStatuts)
        .onConflictDoUpdate({
          target: [
            actionStatutTable.collectiviteId,
            actionStatutTable.actionId,
          ],
          set: buildConflictUpdateColumns(actionStatutTable, [
            'avancement',
            'avancementDetaille',
            'concerne',
            'modifiedBy',
            'modifiedAt',
          ]),
        })
        .returning();

      return success(
        upsertedRows.map((current) => ({
          current,
          previous: previousByActionId.get(current.actionId) ?? null,
        }))
      );
    } catch (error) {
      if (
        isErrorWithCause(error) &&
        error.cause.code ===
          PgIntegrityConstraintViolation.ForeignKeyViolation &&
        error.cause.constraint === 'action_statut_action_id_fkey'
      ) {
        return failure(UpdateActionStatutErrorEnum.ACTION_NOT_FOUND);
      }

      this.logger.error(error);
      return failure(
        'DATABASE_ERROR',
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }
}
