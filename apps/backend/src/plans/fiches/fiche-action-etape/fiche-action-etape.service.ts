import { ficheActionTable } from '@/backend/plans/fiches/shared/models/fiche-action.table';
import { AuthUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Injectable } from '@nestjs/common';
import { and, eq, gt, gte, lt, lte, sql } from 'drizzle-orm';
import FicheActionPermissionsService from '../fiche-action-permissions.service';
import {
  ficheActionEtapeTable,
  FicheActionEtapeType,
  UpsertFicheActionEtapeType,
} from './fiche-action-etape.table';

@Injectable()
export class FicheActionEtapeService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly ficheService: FicheActionPermissionsService
  ) {}

  /**
   * Ajoute ou modifie une étape d'une fiche
   * et réorganise les autres étapes en fonction
   * @param etape
   * @param tokenInfo
   */
  async upsertEtape(
    etape: UpsertFicheActionEtapeType,
    tokenInfo: AuthUser
  ): Promise<FicheActionEtapeType> {
    const { id, ficheId, nom, ordre, realise = false } = etape;
    await this.ficheService.canWriteFiche(ficheId, tokenInfo);
    const userId = tokenInfo?.id;

    return await this.databaseService.db.transaction(async (trx) => {
      if (id) {
        // Si on déplace une étape existante (drag and drop)
        const currentEtape = await trx
          .select({
            ordre: ficheActionEtapeTable.ordre,
          })
          .from(ficheActionEtapeTable)
          .where(
            and(
              eq(ficheActionEtapeTable.id, id),
              eq(ficheActionEtapeTable.ficheId, ficheId)
            )
          )
          .limit(1);

        if (currentEtape.length === 0) {
          throw new Error("L'étape spécifiée n'existe pas.");
        }

        const currentOrdre = currentEtape[0].ordre;

        if (currentOrdre !== ordre) {
          if (currentOrdre < ordre) {
            // Si l'étape descend (ex : de 2 à 4)
            await trx
              .update(ficheActionEtapeTable)
              .set({ ordre: sql`${ficheActionEtapeTable.ordre} - 1` })
              .where(
                and(
                  eq(ficheActionEtapeTable.ficheId, ficheId),
                  gt(ficheActionEtapeTable.ordre, currentOrdre),
                  lte(ficheActionEtapeTable.ordre, ordre)
                )
              );
          } else {
            // Si l'étape monte (ex : de 4 à 2)
            await trx
              .update(ficheActionEtapeTable)
              .set({ ordre: sql`${ficheActionEtapeTable.ordre} + 1` })
              .where(
                and(
                  eq(ficheActionEtapeTable.ficheId, ficheId),
                  gte(ficheActionEtapeTable.ordre, ordre),
                  lt(ficheActionEtapeTable.ordre, currentOrdre)
                )
              );
          }
        }
      } else {
        // Si on insère une nouvelle étape
        await trx
          .update(ficheActionEtapeTable)
          .set({ ordre: sql`${ficheActionEtapeTable.ordre} + 1` })
          .where(
            and(
              eq(ficheActionEtapeTable.ficheId, ficheId),
              gte(ficheActionEtapeTable.ordre, ordre)
            )
          );
      }

      // Insertion ou mise à jour de l'étape avec `RETURNING`
      const [result] = await trx
        .insert(ficheActionEtapeTable)
        .values({
          id, // Si `id` est défini, mise à jour via `onConflict`
          ficheId,
          nom,
          ordre,
          realise,
          createdBy: userId,
          modifiedBy: userId,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: [ficheActionEtapeTable.id],
          set: {
            nom,
            ordre,
            realise,
            modifiedBy: userId,
            modifiedAt: new Date().toISOString(),
          },
        })
        .returning();

      // Met à jour la table fiche action
      await trx
        .update(ficheActionTable)
        .set({ modifiedBy: userId, modifiedAt: new Date().toISOString() })
        .where(eq(ficheActionTable.id, ficheId));

      return result;
    });
  }

  /**
   * Supprime une étape d'une fiche et réorganise les autres étapes en fonction
   * @param etapeId
   * @param tokenInfo
   */
  async deleteEtape(etapeId: number, tokenInfo: AuthUser) {
    return this.databaseService.db.transaction(async (trx) => {
      // Récupérer l'ordre et la fiche de l'étape à supprimer
      const stepToDelete = await trx
        .select({
          ordre: ficheActionEtapeTable.ordre,
          ficheId: ficheActionEtapeTable.ficheId,
        })
        .from(ficheActionEtapeTable)
        .where(eq(ficheActionEtapeTable.id, etapeId))
        .then((res) => res[0]);

      if (!stepToDelete) {
        throw new Error('Step not found');
      }

      const { ordre: deletedOrder, ficheId } = stepToDelete;
      await this.ficheService.canWriteFiche(ficheId, tokenInfo);

      // Supprimer l'étape
      await trx
        .delete(ficheActionEtapeTable)
        .where(eq(ficheActionEtapeTable.id, etapeId));

      // Réorganiser les étapes après celle supprimée
      await trx
        .update(ficheActionEtapeTable)
        .set({ ordre: sql`${ficheActionEtapeTable.ordre} - 1` })
        .where(
          and(
            eq(ficheActionEtapeTable.ficheId, ficheId),
            gte(ficheActionEtapeTable.ordre, deletedOrder)
          )
        );

      // Met à jour la table fiche action
      await trx
        .update(ficheActionTable)
        .set({
          modifiedBy: tokenInfo?.id,
          modifiedAt: new Date().toISOString(),
        })
        .where(eq(ficheActionTable.id, ficheId));
    });
  }

  /**
   * Récupère les étapes d'une fiche
   * @param ficheId
   * @param tokenInfo
   */
  async getEtapesByFicheId(
    ficheId: number,
    tokenInfo: AuthUser
  ): Promise<FicheActionEtapeType[]> {
    await this.ficheService.canReadFiche(ficheId, tokenInfo);
    return this.databaseService.db
      .select()
      .from(ficheActionEtapeTable)
      .where(eq(ficheActionEtapeTable.ficheId, ficheId))
      .orderBy(ficheActionEtapeTable.ordre);
  }
}
