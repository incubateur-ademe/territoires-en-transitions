import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ActionImpactStatutCategorie } from '@tet/domain/plans';
import { and, eq } from 'drizzle-orm';
import { actionImpactPanierTable } from '../models/action-impact-panier.table';
import { actionImpactStatutTable } from '../models/action-impact-statut.table';

@Injectable()
export class PanierActionsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async addAction(
    { panierId, actionId }: { panierId: string; actionId: number },
    tx?: Transaction
  ): Promise<void> {
    const db = tx ?? this.databaseService.db;
    await db
      .insert(actionImpactPanierTable)
      .values({ panierId, actionId })
      .onConflictDoNothing();
  }

  async removeAction(
    { panierId, actionId }: { panierId: string; actionId: number },
    tx?: Transaction
  ): Promise<void> {
    const db = tx ?? this.databaseService.db;
    await db
      .delete(actionImpactPanierTable)
      .where(
        and(
          eq(actionImpactPanierTable.panierId, panierId),
          eq(actionImpactPanierTable.actionId, actionId)
        )
      );
  }

  async setStatus(
    {
      panierId,
      actionId,
      categorie,
    }: {
      panierId: string;
      actionId: number;
      categorie: ActionImpactStatutCategorie;
    },
    tx?: Transaction
  ): Promise<void> {
    const db = tx ?? this.databaseService.db;
    await db
      .insert(actionImpactStatutTable)
      .values({ panierId, actionId, categorieId: categorie })
      .onConflictDoUpdate({
        target: [
          actionImpactStatutTable.panierId,
          actionImpactStatutTable.actionId,
        ],
        set: { categorieId: categorie },
      });
  }

  async clearStatus(
    { panierId, actionId }: { panierId: string; actionId: number },
    tx?: Transaction
  ): Promise<void> {
    const db = tx ?? this.databaseService.db;
    await db
      .delete(actionImpactStatutTable)
      .where(
        and(
          eq(actionImpactStatutTable.panierId, panierId),
          eq(actionImpactStatutTable.actionId, actionId)
        )
      );
  }
}
