import { Injectable } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ActionCommentaire } from '@tet/domain/referentiels';
import { and, desc, eq, gt, isNull, sql } from 'drizzle-orm';
import { historiqueActionCommentaireTable } from '../models/historique-action-commentaire.table';

@Injectable()
export class UpdateActionCommentaireHistoriqueRepository {
  /**
   * Sauvegarde l'historique du commentaire d'une action avec déduplication sur une fenêtre d'1 heure.
   *
   * IMPORTANT : le caller doit détenir un lock FOR UPDATE sur la ligne
   * action_commentaire correspondante pour éviter les insertions de doublons concurrents.
   */
  async save(
    tx: Transaction,
    newRow: ActionCommentaire,
    oldRow: ActionCommentaire | null,
    userId: string | null
  ): Promise<void> {
    // Check for recent history entry (same user, same action, within 1 hour)
    const modifiedByCondition = userId
      ? eq(historiqueActionCommentaireTable.modifiedBy, userId)
      : isNull(historiqueActionCommentaireTable.modifiedBy);

    const recentHistory = await tx
      .select({ id: historiqueActionCommentaireTable.id })
      .from(historiqueActionCommentaireTable)
      .where(
        and(
          eq(
            historiqueActionCommentaireTable.collectiviteId,
            newRow.collectiviteId
          ),
          eq(historiqueActionCommentaireTable.actionId, newRow.actionId),
          modifiedByCondition,
          gt(
            historiqueActionCommentaireTable.modifiedAt,
            sql`${newRow.modifiedAt}::timestamptz - interval '1 hour'`
          )
        )
      )
      .orderBy(desc(historiqueActionCommentaireTable.modifiedAt))
      .limit(1);

    if (recentHistory.length > 0) {
      // Dedup: update existing history entry
      await tx
        .update(historiqueActionCommentaireTable)
        .set({
          precision: newRow.commentaire,
          modifiedAt: newRow.modifiedAt,
        })
        .where(
          eq(historiqueActionCommentaireTable.id, recentHistory[0].id)
        );
    } else {
      // Insert new history entry
      await tx.insert(historiqueActionCommentaireTable).values({
        collectiviteId: newRow.collectiviteId,
        actionId: newRow.actionId,
        precision: newRow.commentaire,
        previousPrecision: oldRow?.commentaire ?? null,
        modifiedBy: userId,
        previousModifiedBy: oldRow?.modifiedBy ?? null,
        modifiedAt: newRow.modifiedAt,
        previousModifiedAt: oldRow?.modifiedAt ?? null,
      });
    }
  }
}
