import { Injectable, Logger } from '@nestjs/common';
import {
  Column,
  ColumnBaseConfig,
  ColumnDataType,
  eq,
  ExtractTablesWithRelations,
  TableConfig,
} from 'drizzle-orm';
import { SupabaseJwtPayload } from '../../auth/models/supabase-jwt.models';
import DatabaseService from '../../common/services/database.service';
import {
  ficheActionTable,
  updateFicheActionSchema,
  UpdateFicheActionType,
} from '../models/fiche-action.table';
import { ficheActionAxeTable } from '../models/fiche-action-axe.table';
import { PgTable, PgTransaction } from 'drizzle-orm/pg-core';
import { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import { UpdateFicheActionRequestType } from '../models/update-fiche-action.request';
import { ficheActionThematiqueTable } from '../models/fiche-action-thematique.table';
import { ficheActionSousThematiqueTable } from '../models/fiche-action-sous-thematique.table';
import { ficheActionPartenaireTagTable } from '../models/fiche-action-partenaire-tag.table';
import { ficheActionStructureTagTable } from '../models/fiche-action-structure-tag.table';
import { ficheActionPiloteTable } from '../models/fiche-action-pilote.table';
import { ficheActionReferentTable } from '../models/fiche-action-referent.table';
import { ficheActionActionTable } from '../models/fiche-action-action.table';
import { ficheActionIndicateurTable } from '../models/fiche-action-indicateur.table';
import { ficheActionServiceTagTable } from '../models/fiche-action-service-tag.table';
import { ficheActionFinanceurTagTable } from '../models/fiche-action-financeur-tag.table';
import { ficheActionLienTable } from '../models/fiche-action-lien.table';
import { ficheActionEffetAttenduTable } from '../models/fiche-action-effet-attendu.table';
import { snakeToCamelCase } from 'backend/src/common/services/key-converter.helper';

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

  constructor(private readonly databaseService: DatabaseService) {}

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
      resultatAttendu,
      ...ficheAction
    } = body;

    return await this.databaseService.db.transaction(async (tx) => {
      /**
       * Updates fiche action properties
       */

      // Removes all props that are not in the schema
      const validFicheAction = updateFicheActionSchema.parse(ficheAction);

      const updatedFicheAction = await tx
        .update(ficheActionTable)
        .set(validFicheAction as UpdateFicheActionType)
        .where(eq(ficheActionTable.id, ficheActionId));

      /**
       * Updates junction tables
       */

      if (axes && axes.length > 0) {
        await this.updateRelations(
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
        await this.updateRelations(
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
        await this.updateRelations(
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
        await this.updateRelations(
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
        await this.updateRelations(
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
        await this.updateRelations(
          ficheActionId,
          pilotes,
          tx,
          ficheActionPiloteTable,
          ['tag_id', 'user_id'],
          ficheActionPiloteTable.ficheId,
          [ficheActionPiloteTable.tagId, ficheActionPiloteTable.userId]
        );
      }

      if (referents && referents.length > 0) {
        await this.updateRelations(
          ficheActionId,
          referents,
          tx,
          ficheActionReferentTable,
          ['tag_id', 'user_id'],
          ficheActionReferentTable.ficheId,
          [ficheActionReferentTable.tagId, ficheActionReferentTable.userId]
        );
      }

      if (actions && actions.length > 0) {
        await this.updateRelations(
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
        await this.updateRelations(
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
        await this.updateRelations(
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
        await this.updateRelations(
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
        await this.updateRelations(
          ficheActionId,
          fichesLiees,
          tx,
          ficheActionLienTable,
          ['id'],
          ficheActionLienTable.ficheUne,
          [ficheActionLienTable.ficheDeux]
        );
      }

      if (resultatAttendu && resultatAttendu.length > 0) {
        await this.updateRelations(
          ficheActionId,
          resultatAttendu,
          tx,
          ficheActionEffetAttenduTable,
          ['id'],
          ficheActionEffetAttenduTable.ficheId,
          [ficheActionEffetAttenduTable.effetAttenduId]
        );
      }

      return updatedFicheAction;
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
    const valuesToInsert = this.buildRelationsToUpdate(
      ficheActionId,
      ficheIdColumn,
      relationIdColumns,
      relations,
      relationIdKeys
    );

    // Deletes all existing relations linked to fiche action
    await tx.delete(table).where(eq(ficheIdColumn, ficheActionId));

    // Adds new relations to fiche action
    await tx.insert(table).values(valuesToInsert);
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
        [snakeToCamelCase(ficheIdColumn.name) as keyof RelationObjectType]:
          ficheActionId,
      };

      if (this.isMultipleRelationsToUpdate(value)) {
        relationIdColumns.forEach((column, index) => {
          const key = snakeToCamelCase(column.name) as keyof RelationObjectType;
          (relationObject[key] as any) = value[index];
        });
      } else {
        const key = snakeToCamelCase(
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
      financeurTagId: financeur.financeur_tag.id,
      montantTtc: financeur.montant_ttc,
    }));
  }
}
