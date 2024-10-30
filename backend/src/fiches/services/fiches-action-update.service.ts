import { Injectable } from '@nestjs/common';
import { eq, ExtractTablesWithRelations } from 'drizzle-orm';
import { SupabaseJwtPayload } from '../../auth/models/supabase-jwt.models';
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
import { ficheActionPartenaireTagTable } from '../models/fiche-action-partenaire-tag.table';
import { ficheActionStructureTagTable } from '../models/fiche-action-structure-tag.table';
import { ficheActionPiloteTable } from '../models/fiche-action-pilote.table';
import { ficheActionReferentTable } from '../models/fiche-action-referent.table';
import { ficheActionActionTable } from '../models/fiche-action-action.table';
import { ficheActionIndicateurTable } from '../models/fiche-action-indicateur.table';
import { ficheActionServiceTagTable } from '../models/fiche-action-service-tag.table';
import { ficheActionFinanceurTagTable } from '../models/fiche-action-financeur-tag.table';

@Injectable()
export default class FichesActionUpdateService {
  constructor(private readonly databaseService: DatabaseService) {}

  async updateFicheAction(
    ficheActionId: number,
    body: UpdateFicheActionRequestType,
    tokenInfo: SupabaseJwtPayload
  ) {
    const camelCaseBody = this.convertObjectKeysToCamelCase(body);
    // PARSE
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
      ...ficheAction
    } = camelCaseBody;

    return await this.databaseService.db.transaction(async (tx) => {
      const updatedFicheAction = await tx
        .update(ficheActionTable)
        .set(ficheAction as UpdateFicheActionType)
        .where(eq(ficheActionTable.id, ficheActionId));

      /**
       * Updates junction tables
       */

      if (axes && axes.length > 0) {
        await this.updateRelations(
          ficheActionId,
          axes,
          tx,
          ficheActionAxeTable, // table we want to update
          ['id'], // id key for axes
          ficheActionAxeTable.ficheId, // we want to update this column
          [ficheActionAxeTable.axeId] // and this column
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

      return updatedFicheAction;
    });
  }

  private extractIdsAndMontants(
    financeurs: any[]
  ): { financeurTagId: number; montantTtc: number }[] {
    return financeurs.map((financeur) => ({
      financeurTagId: financeur.financeur_tag.id,
      montantTtc: financeur.montant_ttc,
    }));
  }

  /**
   * Updates many-to-many relations in a junction table.
   */
  private async updateRelations(
    ficheActionId: number,
    relations: { [key: string]: number }[],
    tx: PgTransaction<
      PostgresJsQueryResultHKT,
      Record<string, never>,
      ExtractTablesWithRelations<Record<string, never>>
    >,
    table: any,
    relationIdKeys: string[], // array of keys to identify relations
    ficheIdColumn: any,
    relationIdColumns: any[] // array of relation columns
  ) {
    const valuesToInsert = this.buildValues(
      ficheActionId,
      relationIdColumns,
      relations,
      relationIdKeys
    );

    // Deletes all existing relations linked to fiche action
    await tx.delete(table).where(eq(ficheIdColumn, ficheActionId));

    // Adds new relations to fiche action
    await tx.insert(table).values(valuesToInsert);
  }

  private buildValues(
    ficheActionId: number,
    relationIdColumns: any[],
    relations: { [key: string]: number }[],
    relationIdKeys: string[]
  ) {
    const relationIds = this.collectIds(relations, relationIdKeys);
    const allRelationsToInsert = relationIds.map((relationId) => {
      const relationObject: any = {
        ficheId: ficheActionId,
      };

      relationIdColumns.forEach((column, index) => {
        relationObject[this.snakeToCamelCase(column.name)] = relationId[index];
      });

      return relationObject;
    });
    return allRelationsToInsert;
  }

  private collectIds(
    objects: { [key: string]: number }[],
    keys: string[]
  ): any[] {
    return objects
      .map((object) => keys.map((key) => object[key]))
      .filter((values) => values.every((value) => value !== undefined));
  }

  private snakeToCamelCase(snakeCase: string): string {
    return snakeCase.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  private convertObjectKeysToCamelCase(
    obj: Record<string, any>
  ): Record<string, any> {
    const newObj: Record<string, any> = {};
    for (const key in obj) {
      if (Object.hasOwnProperty.call(obj, key)) {
        const camelCaseKey = this.snakeToCamelCase(key);
        newObj[camelCaseKey] = obj[key];
      }
    }
    return newObj;
  }
}
