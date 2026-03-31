import { Injectable } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ActionStatut } from '@tet/domain/referentiels';
import { and, desc, eq, gt, isNull, sql } from 'drizzle-orm';
import { historiqueActionStatutTable } from '../models/historique-action-statut.table';

@Injectable()
export class UpdateActionStatutHistoriqueRepository {
  /**
   * Sauvegarde l'historique du statut d'une action avec déduplication sur une fenêtre d'1 heure.
   *
   * IMPORTANT : le caller doit détenir un lock FOR UPDATE sur la ligne
   * action_statut correspondante pour éviter les insertions de doublons concurrents.
   */
  async save(
    tx: Transaction,
    newRow: ActionStatut,
    oldRow: ActionStatut | null,
    userId: string | null
  ): Promise<void> {
    // Check for recent history entry (same user, same action, within 1 hour)
    const modifiedByCondition = userId
      ? eq(historiqueActionStatutTable.modifiedBy, userId)
      : isNull(historiqueActionStatutTable.modifiedBy);

    const recentHistory = await tx
      .select({ id: historiqueActionStatutTable.id })
      .from(historiqueActionStatutTable)
      .where(
        and(
          eq(
            historiqueActionStatutTable.collectiviteId,
            newRow.collectiviteId
          ),
          eq(historiqueActionStatutTable.actionId, newRow.actionId),
          modifiedByCondition,
          gt(
            historiqueActionStatutTable.modifiedAt,
            sql`${newRow.modifiedAt}::timestamptz - interval '1 hour'`
          )
        )
      )
      .orderBy(desc(historiqueActionStatutTable.modifiedAt))
      .limit(1);

    if (recentHistory.length > 0) {
      // Dedup: update existing history entry
      await tx
        .update(historiqueActionStatutTable)
        .set({
          avancement: newRow.avancement,
          avancementDetaille: newRow.avancementDetaille,
          modifiedAt: newRow.modifiedAt,
          concerne: newRow.concerne,
        })
        .where(eq(historiqueActionStatutTable.id, recentHistory[0].id));
    } else {
      // Insert new history entry
      await tx.insert(historiqueActionStatutTable).values({
        collectiviteId: newRow.collectiviteId,
        actionId: newRow.actionId,
        avancement: newRow.avancement,
        previousAvancement: oldRow?.avancement ?? null,
        avancementDetaille: newRow.avancementDetaille,
        previousAvancementDetaille: oldRow?.avancementDetaille ?? null,
        concerne: newRow.concerne,
        previousConcerne: oldRow?.concerne ?? null,
        modifiedBy: userId,
        previousModifiedBy: oldRow?.modifiedBy ?? null,
        modifiedAt: newRow.modifiedAt,
        previousModifiedAt: oldRow?.modifiedAt ?? null,
      });
    }
  }
}
