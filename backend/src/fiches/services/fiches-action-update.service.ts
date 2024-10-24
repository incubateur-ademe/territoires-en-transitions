import { Injectable } from '@nestjs/common';
import { and, eq, ExtractTablesWithRelations, notInArray } from 'drizzle-orm';
import { SupabaseJwtPayload } from '../../auth/models/auth.models';
import DatabaseService from '../../common/services/database.service';
import {
  ficheActionTable,
  UpdateFicheActionType,
} from '../models/fiche-action.table';
import { ficheActionAxeTable } from '../models/fiche-action-axe.table';
import { PgTransaction } from 'drizzle-orm/pg-core';
import { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import { UpdateFicheActionRequestType } from '../models/update-fiche-action.request';
import { ficheActionThematiqueTable } from '../models/fiche-action-thematique.table';
import { ficheActionSousThematiqueTable } from '../models/fiche-action-sous-thematique.table';

@Injectable()
export default class FichesActionUpdateService {
  constructor(private readonly databaseService: DatabaseService) {}

  async updateFicheAction(
    ficheActionId: number,
    body: UpdateFicheActionRequestType,
    tokenInfo: SupabaseJwtPayload
  ) {
    const { axes, thematiques, sous_thematiques, ...ficheAction } = body;
    return await this.databaseService.db.transaction(async (tx) => {
      const updatedFicheAction = await tx
        .update(ficheActionTable)
        .set(ficheAction as UpdateFicheActionType)
        .where(eq(ficheActionTable.id, ficheActionId));

      // Updates juction tables

      if (axes && axes.length > 0) {
        await this.updateRelations(
          ficheActionId,
          axes,
          tx,
          ficheActionAxeTable,
          ficheActionAxeTable.fiche_id,
          ficheActionAxeTable.axe_id
        );
      }

      if (thematiques && thematiques.length > 0) {
        await this.updateRelations(
          ficheActionId,
          thematiques,
          tx,
          ficheActionThematiqueTable,
          ficheActionThematiqueTable.fiche_id,
          ficheActionThematiqueTable.thematique_id
        );
      }

      if (sous_thematiques && sous_thematiques.length > 0) {
        await this.updateRelations(
          ficheActionId,
          sous_thematiques,
          tx,
          ficheActionSousThematiqueTable,
          ficheActionSousThematiqueTable.fiche_id,
          ficheActionSousThematiqueTable.thematique_id
        );
      }

      return updatedFicheAction;
    });
  }

  private collectIds(objects: { id?: number }[]): number[] {
    return objects
      .map((object) => object.id)
      .filter((id): id is number => id !== undefined);
  }

  private async updateRelations(
    ficheActionId: number,
    relations: { id?: number }[],
    tx: PgTransaction<
      PostgresJsQueryResultHKT,
      Record<string, never>,
      ExtractTablesWithRelations<Record<string, never>>
    >,
    table: any,
    ficheIdColumn: any,
    relationIdColumn: any
  ) {
    const relationIds = this.collectIds(relations);

    // Deletes relations that are no longuer linked to fiche action
    await tx
      .delete(table)
      .where(
        and(
          eq(ficheIdColumn, ficheActionId),
          notInArray(relationIdColumn, relationIds)
        )
      );

    // Adds new relations to fiche action
    await tx
      .insert(table)
      .values(
        relationIds.map((relationId) => ({
          fiche_id: ficheActionId,
          [relationIdColumn.name]: relationId,
        }))
      )
      .onConflictDoNothing({
        target: [ficheIdColumn, relationIdColumn],
      });
  }
}
