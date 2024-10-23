import { Injectable } from '@nestjs/common';
import { and, eq, ExtractTablesWithRelations, notInArray } from 'drizzle-orm';
import { SupabaseJwtPayload } from '../../auth/models/auth.models';
import DatabaseService from '../../common/services/database.service';
import {
  ficheActionTable,
  UpdateFicheActionType,
} from '../models/fiche-action.table';
import { UpsertFicheActionRequestType } from '../models/upsert-fiche-action.request';
// import { UpdateAxeRequestType } from '../models/update-fiche-action.request';
import { ficheActionAxeTable } from '../models/fiche-action-axe.table';
import { PgTransaction } from 'drizzle-orm/pg-core';
import { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import { UpdateFicheActionRequestType } from '../models/update-fiche-action.request';
import { ficheActionThematiqueTable } from '../models/fiche-action-thematique.table';

@Injectable()
export default class FichesActionUpdateService {
  constructor(private readonly databaseService: DatabaseService) {}

  async updateFicheAction(
    ficheActionId: number,
    body: UpdateFicheActionRequestType,
    tokenInfo: SupabaseJwtPayload
  ) {
    const { axes, thematiques, ...ficheAction } = body;
    return await this.databaseService.db.transaction(async (tx) => {
      const updatedFicheAction = await tx
        .update(ficheActionTable)
        .set(ficheAction as UpdateFicheActionType)
        .where(eq(ficheActionTable.id, ficheActionId))
        .returning();

      /**
       * ===== AXES: start =====
       */

      // if (axes && axes.length > 0) this.updateAxes(ficheActionId, axes, tx);
      if (axes && axes.length > 0) {
        const axesIds = this.collectIds(axes);

        /**
         * Axes update, step 1: removing all axes that are not linked to fiche action anymore
         */
        await tx
          .delete(ficheActionAxeTable)
          .where(
            and(
              eq(ficheActionAxeTable.fiche_id, ficheActionId),
              notInArray(ficheActionAxeTable.axe_id, axesIds)
            )
          );

        /**
         * Axes update, step 2: add new axes to fiche action and leave all existing relevant axes
         */

        await tx
          .insert(ficheActionAxeTable)
          .values(
            axesIds.map((axeId) => ({
              fiche_id: ficheActionId,
              axe_id: axeId,
            }))
          )
          .onConflictDoNothing({
            target: [ficheActionAxeTable.fiche_id, ficheActionAxeTable.axe_id],
          });
      }

      /**
       * ===== AXES: end =====
       */

      /**
       * ===== THEMATIQUES: start =====
       */

      if (thematiques && thematiques.length > 0) {
        const thematiquesIds = this.collectIds(thematiques);

        await tx
          .delete(ficheActionThematiqueTable)
          .where(
            and(
              eq(ficheActionThematiqueTable.fiche_id, ficheActionId),
              notInArray(
                ficheActionThematiqueTable.thematique_id,
                thematiquesIds
              )
            )
          );

        await tx
          .insert(ficheActionThematiqueTable)
          .values(
            thematiquesIds.map((thematiqueId) => ({
              fiche_id: ficheActionId,
              thematique_id: thematiqueId,
            }))
          )
          .onConflictDoNothing({
            target: [
              ficheActionThematiqueTable.fiche_id,
              ficheActionThematiqueTable.thematique_id,
            ],
          });
      }

      /**
       * ===== THEMATIQUES: end =====
       */

      return updatedFicheAction;
    });
  }

  collectIds(objects: { id?: number }[]): number[] {
    return objects
      .map((object) => object.id)
      .filter((id): id is number => id !== undefined);
  }

  /**
   * Not working (only one of the two actions is executed)
   */
  // async updateAxes(
  //   ficheActionId: number,
  //   axes: UpdateAxeRequestType[],
  //   tx: PgTransaction<
  //     PostgresJsQueryResultHKT,
  //     Record<string, never>,
  //     ExtractTablesWithRelations<Record<string, never>>
  //   >
  // ) {
  //   const axesIds: number[] = axes
  //     .map((axe) => axe.id)
  //     .filter((id): id is number => id !== undefined);

  //   console.log(axesIds);

  //   /**
  //    * Axes update, step 1: removing all axes that are not linked to fiche action anymore
  //    */

  //   await tx
  //     .delete(ficheActionAxeTable)
  //     .where(
  //       and(
  //         eq(ficheActionAxeTable.fiche_id, ficheActionId),
  //         notInArray(ficheActionAxeTable.axe_id, axesIds)
  //       )
  //     );

  //   /**
  //    * Axes update, step 2: add new axes to fiche action and leave all existing relevant axes
  //    */

  //   console.log('Inserting axes into ficheActionAxeTable with ids:', axesIds);

  //   await tx
  //     .insert(ficheActionAxeTable)
  //     .values(
  //       axesIds.map((axeId) => ({
  //         fiche_id: ficheActionId,
  //         axe_id: axeId,
  //       }))
  //     )
  //     .onConflictDoNothing({
  //       target: [ficheActionAxeTable.fiche_id, ficheActionAxeTable.axe_id],
  //     });

  //   console.log('Inserting done');
  // }
}
