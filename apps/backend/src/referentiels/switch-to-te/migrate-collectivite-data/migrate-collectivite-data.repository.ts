import { Injectable } from '@nestjs/common';
import { ficheActionActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-action.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { type FicheActionLink } from '@tet/backend/plans/fiches/update-fiche/fiche-action-link.repository';
import { actionCommentaireTable } from '@tet/backend/referentiels/models/action-commentaire.table';
import { actionPiloteTable } from '@tet/backend/referentiels/models/action-pilote.table';
import { actionServiceTable } from '@tet/backend/referentiels/models/action-service.table';
import { actionStatutTable } from '@tet/backend/referentiels/models/action-statut.table';
import { type ActionPiloteCreate } from '@tet/backend/referentiels/switch-to-te/merge-pilotes/merge-pilotes.rules';
import { type ActionServiceCreate } from '@tet/backend/referentiels/switch-to-te/merge-services/merge-services.rules';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { type Transaction } from '@tet/backend/utils/database/transaction.utils';
import { type ReferentielId } from '@tet/domain/referentiels';
import { and, eq, like, sql } from 'drizzle-orm';
import { unionAll } from 'drizzle-orm/pg-core';

export type ActionStatutInsertRow = typeof actionStatutTable.$inferInsert;

export type ActionCommentaireInsertRow =
  typeof actionCommentaireTable.$inferInsert;

@Injectable()
export class MigrateCollectiviteDataRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async hasCollectiviteReferentielData(
    collectiviteId: number,
    referentielId: ReferentielId,
    tx?: Transaction
  ): Promise<boolean> {
    const db = tx ?? this.databaseService.db;
    const actionIdPattern = `${referentielId}_%`;
    const referentielFilter = (
      table:
        | typeof actionStatutTable
        | typeof actionCommentaireTable
        | typeof actionPiloteTable
        | typeof actionServiceTable
    ) =>
      and(
        eq(table.collectiviteId, collectiviteId),
        like(table.actionId, actionIdPattern)
      );

    const referentielDataExists = unionAll(
      db
        .select({ one: sql<number>`1` })
        .from(actionStatutTable)
        .where(referentielFilter(actionStatutTable))
        .limit(1),
      db
        .select({ one: sql<number>`1` })
        .from(actionCommentaireTable)
        .where(referentielFilter(actionCommentaireTable))
        .limit(1),
      db
        .select({ one: sql<number>`1` })
        .from(actionPiloteTable)
        .where(referentielFilter(actionPiloteTable))
        .limit(1),
      db
        .select({ one: sql<number>`1` })
        .from(actionServiceTable)
        .where(referentielFilter(actionServiceTable))
        .limit(1),
      db
        .select({ one: sql<number>`1` })
        .from(ficheActionActionTable)
        .innerJoin(
          ficheActionTable,
          eq(ficheActionActionTable.ficheId, ficheActionTable.id)
        )
        .where(
          and(
            eq(ficheActionTable.collectiviteId, collectiviteId),
            like(ficheActionActionTable.actionId, actionIdPattern)
          )
        )
        .limit(1)
    ).as('referentiel_data');

    const found = await db
      .select({ one: sql<number>`1` })
      .from(referentielDataExists)
      .limit(1);

    return found.length > 0;
  }

  async insertStatuts(
    rows: ActionStatutInsertRow[],
    tx?: Transaction
  ): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    await (tx ?? this.databaseService.db)
      .insert(actionStatutTable)
      .values(rows)
      .onConflictDoNothing();
  }

  async insertCommentaires(
    rows: ActionCommentaireInsertRow[],
    tx?: Transaction
  ): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    await (tx ?? this.databaseService.db)
      .insert(actionCommentaireTable)
      .values(rows)
      .onConflictDoNothing();
  }

  async insertPilotes(
    rows: ActionPiloteCreate[],
    tx?: Transaction
  ): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    await (tx ?? this.databaseService.db)
      .insert(actionPiloteTable)
      .values(rows)
      .onConflictDoNothing();
  }

  async insertServices(
    rows: ActionServiceCreate[],
    tx?: Transaction
  ): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    await (tx ?? this.databaseService.db)
      .insert(actionServiceTable)
      .values(rows)
      .onConflictDoNothing();
  }

  async insertFicheLinks(
    rows: FicheActionLink[],
    tx?: Transaction
  ): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    await (tx ?? this.databaseService.db)
      .insert(ficheActionActionTable)
      .values(rows)
      .onConflictDoNothing();
  }
}
