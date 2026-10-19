import { Injectable } from '@nestjs/common';
import { actionStatutTable } from '@tet/backend/referentiels/models/action-statut.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { type Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  StatutAvancementEnum,
  type StatutAvancementCreateInDatabase,
} from '@tet/domain/referentiels';
import { and, eq, gte, like, lte, sql } from 'drizzle-orm';

export type RepairedStatutValues = {
  avancement: StatutAvancementCreateInDatabase;
  avancementDetaille: [number, number, number] | null;
  concerne: boolean;
};

@Injectable()
export class RepairSwitchToTeStatutsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Horodatage commun des statuts TE écrits par la bascule : ils partagent
   * tous le même `modified_at`, posé juste après `populatedAt` par l'auteur de
   * la bascule. Retourné en texte pour être réutilisé tel quel en comparaison
   * d'égalité.
   *
   * La recherche est bornée à la minute qui suit `populatedAt` (la bascule
   * écrit ses statuts moins d'une seconde après) : sans borne, une fois toutes
   * les lignes de bascule rattrapées ou modifiées, le minimum pourrait tomber
   * sur une saisie ultérieure de l'auteur de la bascule. Hors fenêtre → `null`,
   * et rien n'est écrit.
   */
  async getBasculeModifiedAt(
    collectiviteId: number,
    populatedAt: string,
    populatedBy: string
  ): Promise<string | null> {
    const [row] = await this.databaseService.db
      .select({
        modifiedAt: sql<
          string | null
        >`min(${actionStatutTable.modifiedAt})::text`,
      })
      .from(actionStatutTable)
      .where(
        and(
          eq(actionStatutTable.collectiviteId, collectiviteId),
          like(actionStatutTable.actionId, 'te_%'),
          eq(actionStatutTable.modifiedBy, populatedBy),
          gte(actionStatutTable.modifiedAt, populatedAt),
          lte(
            actionStatutTable.modifiedAt,
            sql`${populatedAt}::timestamptz + interval '1 minute'`
          )
        )
      );

    return row?.modifiedAt ?? null;
  }

  /**
   * Statuts TE « Non concerné » restés tels que la bascule les a écrits.
   */
  async listIntactNonConcerneActionIds(
    collectiviteId: number,
    basculeModifiedAt: string
  ): Promise<string[]> {
    const rows = await this.databaseService.db
      .select({ actionId: actionStatutTable.actionId })
      .from(actionStatutTable)
      .where(this.intactNonConcerneCondition(collectiviteId, basculeModifiedAt))
      .orderBy(actionStatutTable.actionId);

    return rows.map((row) => row.actionId);
  }

  /**
   * Met à jour un statut seulement s'il est encore intact (une saisie faite
   * entre-temps n'est pas écrasée). Retourne `true` si la ligne a été modifiée.
   */
  async updateIfIntact(
    {
      collectiviteId,
      actionId,
      basculeModifiedAt,
      modifiedBy,
      values,
    }: {
      collectiviteId: number;
      actionId: string;
      basculeModifiedAt: string;
      modifiedBy: string;
      values: RepairedStatutValues;
    },
    tx?: Transaction
  ): Promise<boolean> {
    const updated = await (tx ?? this.databaseService.db)
      .update(actionStatutTable)
      .set({ ...values, modifiedBy })
      .where(
        and(
          this.intactNonConcerneCondition(collectiviteId, basculeModifiedAt),
          eq(actionStatutTable.actionId, actionId)
        )
      )
      .returning({ actionId: actionStatutTable.actionId });

    return updated.length > 0;
  }

  /**
   * Supprime un statut seulement s'il est encore intact. Retourne `true` si la
   * ligne a été supprimée.
   */
  async deleteIfIntact(
    {
      collectiviteId,
      actionId,
      basculeModifiedAt,
    }: {
      collectiviteId: number;
      actionId: string;
      basculeModifiedAt: string;
    },
    tx?: Transaction
  ): Promise<boolean> {
    const deleted = await (tx ?? this.databaseService.db)
      .delete(actionStatutTable)
      .where(
        and(
          this.intactNonConcerneCondition(collectiviteId, basculeModifiedAt),
          eq(actionStatutTable.actionId, actionId)
        )
      )
      .returning({ actionId: actionStatutTable.actionId });

    return deleted.length > 0;
  }

  /**
   * `now()` de la transaction : c'est le `modified_at` que le trigger
   * `update_modified_at` donne aux lignes mises à jour dans cette transaction.
   * Même format texte que `getBasculeModifiedAt`.
   */
  async getTransactionTimestamp(tx: Transaction): Promise<string> {
    const result = await tx.execute<{ now: string }>(
      sql`select now()::text as now`
    );
    return result.rows[0].now;
  }

  private intactNonConcerneCondition(
    collectiviteId: number,
    basculeModifiedAt: string
  ) {
    return and(
      eq(actionStatutTable.collectiviteId, collectiviteId),
      like(actionStatutTable.actionId, 'te_%'),
      eq(actionStatutTable.modifiedAt, basculeModifiedAt),
      eq(actionStatutTable.avancement, StatutAvancementEnum.NON_RENSEIGNE),
      eq(actionStatutTable.concerne, false)
    );
  }
}
