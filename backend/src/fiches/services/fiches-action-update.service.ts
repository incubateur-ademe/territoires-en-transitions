import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  and,
  Column,
  ColumnBaseConfig,
  ColumnDataType,
  eq,
  ExtractTablesWithRelations,
  TableConfig,
} from 'drizzle-orm';
import { PgTable, PgTransaction } from 'drizzle-orm/pg-core';
import { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import { toCamel } from 'postgres';
import { SupabaseJwtPayload } from '../../auth/models/supabase-jwt.models';
import DatabaseService from '../../common/services/database.service';
import { buildConflictUpdateColumns } from '../../common/services/conflict.helper';
import FicheService from './fiche.service';
import {
  ficheActionTable,
  updateFicheActionSchema,
} from '../models/fiche-action.table';
import { ficheActionActionTable } from '../models/fiche-action-action.table';
import { ficheActionAxeTable } from '../models/fiche-action-axe.table';
import { ficheActionEffetAttenduTable } from '../models/fiche-action-effet-attendu.table';
import { ficheActionFinanceurTagTable } from '../models/fiche-action-financeur-tag.table';
import { ficheActionIndicateurTable } from '../models/fiche-action-indicateur.table';
import { ficheActionLienTable } from '../models/fiche-action-lien.table';
import { ficheActionPartenaireTagTable } from '../models/fiche-action-partenaire-tag.table';
import { ficheActionPiloteTable } from '../models/fiche-action-pilote.table';
import { ficheActionReferentTable } from '../models/fiche-action-referent.table';
import { ficheActionServiceTagTable } from '../models/fiche-action-service-tag.table';
import { ficheActionSousThematiqueTable } from '../models/fiche-action-sous-thematique.table';
import { ficheActionThematiqueTable } from '../models/fiche-action-thematique.table';
import { ficheActionStructureTagTable } from '../models/fiche-action-structure-tag.table';
import { UpdateFicheActionRequestType } from '../models/update-fiche-action.request';
import {
  ficheActionNoteTable,
  UpsertFicheActionNoteType,
} from '../models/fiche-action-note.table';

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
    tokenInfo: SupabaseJwtPayload
  ) {
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
      ...unsafeFicheAction
    } = body;

    return await this.databaseService.db.transaction(async (tx) => {
      const existingFicheAction = await this.databaseService.db
        .select()
        .from(ficheActionTable)
        .where(eq(ficheActionTable.id, ficheActionId));

      if (existingFicheAction.length === 0) {
        throw new NotFoundException('Fiche action not found');
      }

      // Removes all props that are not in the schema
      const ficheAction = updateFicheActionSchema.parse(unsafeFicheAction);

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

      /**
       * Updates fiche action properties
       */

      if (Object.keys(ficheAction).length > 0) {
        updatedFicheAction = await tx
          .update(ficheActionTable)
          .set(ficheAction)
          .where(eq(ficheActionTable.id, ficheActionId))
          .returning();
      }

      /**
       * Updates junction tables
       */

      if (axes && axes.length > 0) {
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

      if (thematiques && thematiques.length > 0) {
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

      if (sousThematiques && sousThematiques.length > 0) {
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

      if (partenaires && partenaires.length > 0) {
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

      if (structures && structures.length > 0) {
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

      if (pilotes && pilotes.length > 0) {
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

      if (referents && referents.length > 0) {
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

      if (actions && actions.length > 0) {
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

      if (indicateurs && indicateurs.length > 0) {
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

      if (services && services.length > 0) {
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

      if (financeurs && financeurs.length > 0) {
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

      if (fichesLiees && fichesLiees.length > 0) {
        updatedFichesLiees = await this.updateRelations(
          ficheActionId,
          fichesLiees,
          tx,
          ficheActionLienTable,
          ['id'],
          ficheActionLienTable.ficheUne,
          [ficheActionLienTable.ficheDeux]
        );
      }

      if (resultatsAttendus && resultatsAttendus.length > 0) {
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
        resultatAttendu: updatedResultatsAttendus,
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
    relations: any[],
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
      relations,
      relationIdKeys
    );

    // Deletes all existing relations linked to fiche action
    await tx.delete(table).where(eq(ficheIdColumn, ficheActionId));

    // Adds new relations to fiche action
    return await tx.insert(table).values(relationsToUpdate).returning();
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
    financeurs: any[]
  ): { financeurTagId: number; montantTtc: number }[] {
    return financeurs.map((financeur) => ({
      financeurTagId: financeur.financeurTag.id,
      montantTtc: financeur.montantTtc,
    }));
  }

  /** Insère ou met à jour des notes de suivi */
  async upsertNotes(
    ficheId: number,
    notes: UpsertFicheActionNoteType[],
    tokenInfo: SupabaseJwtPayload
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
          createdBy: tokenInfo.sub,
          modifiedBy: tokenInfo.sub,
        }))
      )
      .onConflictDoUpdate({
        target: [ficheActionNoteTable.ficheId, ficheActionNoteTable.dateNote],
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
    dateNote: string,
    tokenInfo: SupabaseJwtPayload
  ) {
    this.logger.log(
      `Vérifie les droits avant de supprimer la note datée ${dateNote} de la fiche ${ficheId}`
    );

    const canWrite = await this.ficheService.canWriteFiche(ficheId, tokenInfo);
    if (!canWrite) return false;

    this.logger.log(
      `Supprime la note datée ${dateNote} de la fiche ${ficheId}`
    );
    return this.databaseService.db
      .delete(ficheActionNoteTable)
      .where(
        and(
          eq(ficheActionNoteTable.ficheId, ficheId),
          eq(ficheActionNoteTable.dateNote, dateNote)
        )
      );
  }
}
