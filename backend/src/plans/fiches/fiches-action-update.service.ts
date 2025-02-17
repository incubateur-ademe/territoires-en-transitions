import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  and,
  Column,
  ColumnBaseConfig,
  ColumnDataType,
  eq,
  ExtractTablesWithRelations,
  or,
  TableConfig,
} from 'drizzle-orm';
import { PgTable, PgTransaction } from 'drizzle-orm/pg-core';
import { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import { toCamel } from 'ts-case-convert';
import { AuthenticatedUser } from '../../auth/models/auth.models';
import { buildConflictUpdateColumns } from '../../utils/database/conflict.utils';
import FicheService from './fiche.service';
import { UpdateFicheActionRequestType } from './shared/edit-fiche.request';
import { ficheActionActionTable } from './shared/models/fiche-action-action.table';
import { ficheActionAxeTable } from './shared/models/fiche-action-axe.table';
import { ficheActionEffetAttenduTable } from './shared/models/fiche-action-effet-attendu.table';
import { ficheActionFinanceurTagTable } from './shared/models/fiche-action-financeur-tag.table';
import { ficheActionIndicateurTable } from './shared/models/fiche-action-indicateur.table';
import { ficheActionLibreTagTable } from './shared/models/fiche-action-libre-tag.table';
import { ficheActionLienTable } from './shared/models/fiche-action-lien.table';
import {
  ficheActionNoteTable,
  UpsertFicheActionNoteType,
} from './shared/models/fiche-action-note.table';
import { ficheActionPartenaireTagTable } from './shared/models/fiche-action-partenaire-tag.table';
import { ficheActionPiloteTable } from './shared/models/fiche-action-pilote.table';
import { ficheActionReferentTable } from './shared/models/fiche-action-referent.table';
import { ficheActionServiceTagTable } from './shared/models/fiche-action-service-tag.table';
import { ficheActionSousThematiqueTable } from './shared/models/fiche-action-sous-thematique.table';
import { ficheActionStructureTagTable } from './shared/models/fiche-action-structure-tag.table';
import { ficheActionThematiqueTable } from './shared/models/fiche-action-thematique.table';
import {
  ficheActionTable,
  ficheSchemaUpdate,
} from './shared/models/fiche-action.table';

type TxType = PgTransaction<
  PostgresJsQueryResultHKT,
  Record<string, never>,
  ExtractTablesWithRelations<Record<string, never>>
>;

type ColumnType = Column<
  ColumnBaseConfig<ColumnDataType, string>,
  object,
  object
>;

type RelationObjectType =
  | { ficheId: number | string; axeId: number }
  | { ficheId: number | string; thematiqueId: number }
  | { ficheId: number | string; partenaireTagId: number }
  | { ficheId: number | string; structureTagId: number }
  | { ficheId: number | string; tagId: number; userId: string }
  | { ficheId: number | string; actionId: string }
  | { ficheId: number | string; indicateurId: number }
  | { ficheId: number | string; serviceTagId: number }
  | { ficheId: number | string; financeurTagId: number; montantTtc: number }
  | { ficheUne: number | string; ficheDeux: number }
  | { ficheId: number | string; effetAttenduId: number };

@Injectable()
export default class FichesActionUpdateService {
  private readonly logger = new Logger(FichesActionUpdateService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly ficheService: FicheService
  ) {}

  async updateFicheAction(
    ficheActionId: number,
    body: UpdateFicheActionRequestType,
    user: AuthenticatedUser
  ) {
    await this.ficheService.canWriteFiche(ficheActionId, user);

    this.logger.log(
      `Mise à jour de la fiche action dont l'id est ${ficheActionId}`
    );

    const {
      axes,
      thematiques,
      sousThematiques,
      partenaires,
      structures,
      pilotes,
      referents,
      actions,
      indicateurs,
      services,
      financeurs,
      fichesLiees,
      resultatsAttendus,
      libresTag,
      ...unsafeFicheAction
    } = body;

    return await this.databaseService.rls(user)(async (tx) => {
      const existingFicheAction = await this.databaseService.db
        .select()
        .from(ficheActionTable)
        .where(eq(ficheActionTable.id, ficheActionId));

      if (existingFicheAction.length === 0) {
        throw new NotFoundException('Fiche action not found');
      }

      // Removes all props that are not in the schema
      const ficheAction = ficheSchemaUpdate.parse(unsafeFicheAction);

      let updatedFicheAction;
      let updatedAxes;
      let updatedThematiques;
      let updatedSousThematiques;
      let updatedPartenaires;
      let updatedStructures;
      let updatedPilotes;
      let updatedReferents;
      let updatedActions;
      let updatedIndicateurs;
      let updatedServices;
      let updatedFinanceurs;
      let updatedFichesLiees;
      let updatedResultatsAttendus;
      let updatedLibresTag;

      /**
       * Updates fiche action properties
       */

      if (Object.keys(body).length > 0) {
        updatedFicheAction = await tx
          .update(ficheActionTable)
          // `modifiedBy` in the fiche_action table is automatically updated
          // via a PG trigger (using the current authenticated user of `db.rls()`).
          // But we also set it here so that when the updating object `ficheAction` is empty,
          // the trigger can be well… triggered (corresponding to updates only affecting
          // related tables, and not directly the fiche_action main table)
          .set({ ...ficheAction, modifiedBy: user.id })
          .where(eq(ficheActionTable.id, ficheActionId))
          .returning();
      }

      /**
       * Updates junction tables
       */

      if (axes !== undefined) {
        updatedAxes = await this.updateRelations(
          ficheActionId,
          axes,
          tx,
          ficheActionAxeTable,
          ['id'],
          ficheActionAxeTable.ficheId,
          [ficheActionAxeTable.axeId]
        );
      }

      if (thematiques !== undefined) {
        updatedThematiques = await this.updateRelations(
          ficheActionId,
          thematiques,
          tx,
          ficheActionThematiqueTable,
          ['id'],
          ficheActionThematiqueTable.ficheId,
          [ficheActionThematiqueTable.thematiqueId]
        );
      }

      if (sousThematiques !== undefined) {
        updatedSousThematiques = await this.updateRelations(
          ficheActionId,
          sousThematiques,
          tx,
          ficheActionSousThematiqueTable,
          ['id'],
          ficheActionSousThematiqueTable.ficheId,
          [ficheActionSousThematiqueTable.thematiqueId]
        );
      }

      if (partenaires !== undefined) {
        updatedPartenaires = await this.updateRelations(
          ficheActionId,
          partenaires,
          tx,
          ficheActionPartenaireTagTable,
          ['id'],
          ficheActionPartenaireTagTable.ficheId,
          [ficheActionPartenaireTagTable.partenaireTagId]
        );
      }

      if (structures !== undefined) {
        updatedStructures = await this.updateRelations(
          ficheActionId,
          structures,
          tx,
          ficheActionStructureTagTable,
          ['id'],
          ficheActionStructureTagTable.ficheId,
          [ficheActionStructureTagTable.structureTagId]
        );
      }

      if (pilotes !== undefined) {
        updatedPilotes = await this.updateRelations(
          ficheActionId,
          pilotes,
          tx,
          ficheActionPiloteTable,
          ['tagId', 'userId'],
          ficheActionPiloteTable.ficheId,
          [ficheActionPiloteTable.tagId, ficheActionPiloteTable.userId]
        );
      }

      if (referents !== undefined) {
        updatedReferents = await this.updateRelations(
          ficheActionId,
          referents,
          tx,
          ficheActionReferentTable,
          ['tagId', 'userId'],
          ficheActionReferentTable.ficheId,
          [ficheActionReferentTable.tagId, ficheActionReferentTable.userId]
        );
      }

      if (actions !== undefined) {
        updatedActions = await this.updateRelations(
          ficheActionId,
          actions,
          tx,
          ficheActionActionTable,
          ['id'],
          ficheActionActionTable.ficheId,
          [ficheActionActionTable.actionId]
        );
      }

      if (indicateurs !== undefined) {
        updatedIndicateurs = await this.updateRelations(
          ficheActionId,
          indicateurs,
          tx,
          ficheActionIndicateurTable,
          ['id'],
          ficheActionIndicateurTable.ficheId,
          [ficheActionIndicateurTable.indicateurId]
        );
      }

      if (services !== undefined) {
        updatedServices = await this.updateRelations(
          ficheActionId,
          services,
          tx,
          ficheActionServiceTagTable,
          ['id'],
          ficheActionServiceTagTable.ficheId,
          [ficheActionServiceTagTable.serviceTagId]
        );
      }

      if (financeurs !== undefined) {
        const flatFinanceurs = this.extractIdsAndMontants(financeurs);
        updatedFinanceurs = await this.updateRelations(
          ficheActionId,
          flatFinanceurs,
          tx,
          ficheActionFinanceurTagTable,
          ['financeurTagId', 'montantTtc'],
          ficheActionFinanceurTagTable.ficheId,
          [
            ficheActionFinanceurTagTable.financeurTagId,
            ficheActionFinanceurTagTable.montantTtc,
          ]
        );
      }

      if (fichesLiees !== undefined) {
        // Deletes all existing relations linked to fiche action
        await tx
          .delete(ficheActionLienTable)
          .where(
            or(
              eq(ficheActionLienTable.ficheUne, ficheActionId),
              eq(ficheActionLienTable.ficheDeux, ficheActionId)
            )
          );

        // Adds new relations to fiche action
        if (fichesLiees !== null && fichesLiees.length > 0) {
          updatedFichesLiees = await tx
            .insert(ficheActionLienTable)
            .values(
              fichesLiees.map((fiche) => ({
                ficheUne: ficheActionId,
                ficheDeux: fiche.id,
              }))
            )
            .returning();
        }
      }

      if (resultatsAttendus !== undefined) {
        updatedResultatsAttendus = await this.updateRelations(
          ficheActionId,
          resultatsAttendus,
          tx,
          ficheActionEffetAttenduTable,
          ['id'],
          ficheActionEffetAttenduTable.ficheId,
          [ficheActionEffetAttenduTable.effetAttenduId]
        );
      }

      if (libresTag !== undefined) {
        // Delete existing relations
        await tx
          .delete(ficheActionLibreTagTable)
          .where(eq(ficheActionLibreTagTable.ficheId, ficheActionId));

        // Insert new relations
        if (libresTag !== null && libresTag.length > 0) {
          updatedLibresTag = await tx
            .insert(ficheActionLibreTagTable)
            .values(
              libresTag.map((relation) => ({
                ficheId: ficheActionId,
                libreTagId: relation.id,
                createdBy: user.id,
              }))
            )
            .returning();
        } else {
          updatedLibresTag = [];
        }
      }

      return {
        ...(updatedFicheAction?.[0] || {}),
        axes: updatedAxes,
        thematiques: updatedThematiques,
        sousThematiques: updatedSousThematiques,
        partenaires: updatedPartenaires,
        structures: updatedStructures,
        pilotes: updatedPilotes,
        referents: updatedReferents,
        actions: updatedActions,
        indicateurs: updatedIndicateurs,
        services: updatedServices,
        financeurs: updatedFinanceurs,
        fichesLiees: updatedFichesLiees,
        resultatsAttendus: updatedResultatsAttendus,
        libresTag: updatedLibresTag,
      };
    });
  }

  /**
   *
   * @param ficheActionId - the id of the fiche action we're updating
   * @param relations - object we receive from the client
   * @param tx - current database transaction
   * @param table - table we want to update
   * @param relationIdKeys - in the relations object, key(s) of the value(s) we want to use for the update
   * @param ficheIdColumn - fiche action's column we want to update
   * @param relationIdColumns - relation's column we want to update
   */
  private async updateRelations(
    ficheActionId: number,
    relations: any[] | null,
    tx: TxType,
    table: PgTable<TableConfig>,
    relationIdKeys: string[],
    ficheIdColumn: ColumnType,
    relationIdColumns: ColumnType[]
  ) {
    const relationsToUpdate = this.buildRelationsToUpdate(
      ficheActionId,
      ficheIdColumn,
      relationIdColumns,
      relations ?? [],
      relationIdKeys
    );

    // Deletes all existing relations linked to fiche action
    await tx.delete(table).where(eq(ficheIdColumn, ficheActionId));

    // Adds new relations to fiche action
    if (relationsToUpdate.length > 0) {
      return await tx.insert(table).values(relationsToUpdate).returning();
    }

    return [];
  }

  private buildRelationsToUpdate(
    ficheActionId: number,
    ficheIdColumn: ColumnType,
    relationIdColumns: ColumnType[],
    relations: unknown[],
    relationIdKeys: string[]
  ): RelationObjectType[] {
    const values = this.extractValuesForGivenIdKeys(relations, relationIdKeys);
    const allRelationsToUpdate = values.map((value) => {
      const relationObject: Partial<RelationObjectType> = {
        [toCamel(ficheIdColumn.name) as keyof RelationObjectType]:
          ficheActionId,
      };

      if (this.isMultipleRelationsToUpdate(value)) {
        relationIdColumns.forEach((column, index) => {
          const key = toCamel(column.name) as keyof RelationObjectType;
          (relationObject[key] as any) = value[index];
        });
      } else {
        const key = toCamel(
          relationIdColumns[0].name
        ) as keyof RelationObjectType;
        (relationObject[key] as any) = value;
      }

      return relationObject as RelationObjectType;
    });

    return allRelationsToUpdate;
  }

  private isMultipleRelationsToUpdate(value: string | number) {
    return Array.isArray(value);
  }

  private extractValuesForGivenIdKeys(
    objects: any[],
    idKeys: string[]
  ): (string | number)[] {
    return objects.map((object) =>
      idKeys.length === 1 ? object[idKeys[0]] : idKeys.map((key) => object[key])
    );
  }

  private extractIdsAndMontants(
    financeurs: any[] | null
  ): { financeurTagId: number; montantTtc: number }[] {
    return (financeurs ?? []).map((financeur) => ({
      financeurTagId: financeur.financeurTag.id,
      montantTtc: financeur.montantTtc,
    }));
  }

  /** Insère ou met à jour des notes de suivi */
  async upsertNotes(
    ficheId: number,
    notes: UpsertFicheActionNoteType[],
    tokenInfo: AuthenticatedUser
  ) {
    this.logger.log(
      `Vérifie les droits avant de mettre à jour les notes de la fiche ${ficheId}`
    );

    const canWrite = await this.ficheService.canWriteFiche(ficheId, tokenInfo);
    if (!canWrite) return false;

    this.logger.log(`Met à jour les notes de la fiche ${ficheId}`);
    return this.databaseService.db
      .insert(ficheActionNoteTable)
      .values(
        notes.map((note) => ({
          ...note,
          ficheId,
          createdBy: tokenInfo.id,
          modifiedBy: tokenInfo.id,
        }))
      )
      .onConflictDoUpdate({
        target: [ficheActionNoteTable.id],
        set: buildConflictUpdateColumns(ficheActionNoteTable, [
          'note',
          'modifiedAt',
          'modifiedBy',
        ]),
      });
  }

  /** Supprime une note */
  async deleteNote(
    ficheId: number,
    noteId: number,
    tokenInfo: AuthenticatedUser
  ) {
    this.logger.log(
      `Vérifie les droits avant de supprimer la note ${noteId} de la fiche ${ficheId}`
    );

    const canWrite = await this.ficheService.canWriteFiche(ficheId, tokenInfo);
    if (!canWrite) return false;

    this.logger.log(`Supprime la note ${noteId} de la fiche ${ficheId}`);
    return this.databaseService.db
      .delete(ficheActionNoteTable)
      .where(
        and(
          eq(ficheActionNoteTable.ficheId, ficheId),
          eq(ficheActionNoteTable.id, noteId)
        )
      );
  }
}
