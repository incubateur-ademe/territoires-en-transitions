import ListFichesService from '@/backend/plans/fiches/list-fiches/list-fiches.service';
import { ShareFicheService } from '@/backend/plans/fiches/share-fiches/share-fiche.service';
import { ApplicationSousScopesEnum } from '@/backend/utils/application-domains.enum';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { WebhookService } from '@/backend/utils/webhooks/webhook.service';
import { Injectable, Logger } from '@nestjs/common';
import {
  Column,
  ColumnBaseConfig,
  ColumnDataType,
  eq,
  or,
  TableConfig,
} from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import { toCamel } from 'ts-case-convert';
import { AuthenticatedUser } from '../../../users/models/auth.models';
import FicheActionPermissionsService from '../fiche-action-permissions.service';
import { ficheActionActionTable } from '../shared/models/fiche-action-action.table';
import { ficheActionAxeTable } from '../shared/models/fiche-action-axe.table';
import { ficheActionEffetAttenduTable } from '../shared/models/fiche-action-effet-attendu.table';
import { ficheActionFinanceurTagTable } from '../shared/models/fiche-action-financeur-tag.table';
import { ficheActionIndicateurTable } from '../shared/models/fiche-action-indicateur.table';
import { ficheActionLibreTagTable } from '../shared/models/fiche-action-libre-tag.table';
import { ficheActionLienTable } from '../shared/models/fiche-action-lien.table';
import { ficheActionPartenaireTagTable } from '../shared/models/fiche-action-partenaire-tag.table';
import { ficheActionPiloteTable } from '../shared/models/fiche-action-pilote.table';
import { ficheActionReferentTable } from '../shared/models/fiche-action-referent.table';
import { ficheActionServiceTagTable } from '../shared/models/fiche-action-service-tag.table';
import { ficheActionSousThematiqueTable } from '../shared/models/fiche-action-sous-thematique.table';
import { ficheActionStructureTagTable } from '../shared/models/fiche-action-structure-tag.table';
import { ficheActionThematiqueTable } from '../shared/models/fiche-action-thematique.table';
import {
  ficheActionTable,
  ficheSchemaUpdate,
} from '../shared/models/fiche-action.table';
import { UpdateFicheRequest } from './update-fiche.request';

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
export default class UpdateFicheService {
  private readonly logger = new Logger(UpdateFicheService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly webhookService: WebhookService,
    private readonly ficheActionListService: ListFichesService,
    private readonly fichePermissionService: FicheActionPermissionsService,
    private readonly shareFicheService: ShareFicheService
  ) {}

  async updateFiche({
    ficheId,
    ficheFields,
    user,
  }: {
    ficheId: number;
    ficheFields: UpdateFicheRequest;
    user: AuthenticatedUser;
  }) {
    await this.fichePermissionService.canWriteFiche(ficheId, user);

    this.logger.log(`Mise à jour de la fiche action dont l'id est ${ficheId}`);

    const {
      axes,
      thematiques,
      sousThematiques,
      partenaires,
      structures,
      pilotes,
      referents,
      mesures,
      indicateurs,
      services,
      financeurs,
      fichesLiees,
      effetsAttendus,
      libreTags,
      sharedWithCollectivites,
      tempsDeMiseEnOeuvre,
      ...unsafeFicheAction
    } = ficheFields;

    await this.databaseService.db.transaction(async (tx) => {
      const existingFicheAction =
        await this.ficheActionListService.getFicheById(ficheId, false, user);

      // Removes all props that are not in the schema
      const ficheAction = ficheSchemaUpdate.parse(unsafeFicheAction);

      /**
       * Updates fiche action properties
       */

      // if (tempsDeMiseEnOeuvre !== undefined) {
      //   await tx
      //     .update(ficheActionTable)
      //     .set({
      //       ...ficheAction,
      //       tempsDeMiseEnOeuvre: tempsDeMiseEnOeuvre?.id,
      //     })
      //     .where(eq(ficheActionTable.id, ficheId));
      // }

      if (Object.keys(ficheFields).length > 0) {
        await tx
          .update(ficheActionTable)
          .set({
            ...ficheAction,
            modifiedBy: user.id,
            modifiedAt: new Date().toISOString(),
            tempsDeMiseEnOeuvre: tempsDeMiseEnOeuvre?.id ?? null,
          })
          .where(eq(ficheActionTable.id, ficheId));
      }

      /**
       * Updates junction tables
       */

      if (axes !== undefined) {
        await this.updateRelations(
          ficheId,
          axes,
          tx,
          ficheActionAxeTable,
          ['id'],
          ficheActionAxeTable.ficheId,
          [ficheActionAxeTable.axeId]
        );
      }

      if (thematiques !== undefined) {
        await this.updateRelations(
          ficheId,
          thematiques,
          tx,
          ficheActionThematiqueTable,
          ['id'],
          ficheActionThematiqueTable.ficheId,
          [ficheActionThematiqueTable.thematiqueId]
        );
      }

      if (sousThematiques !== undefined) {
        await this.updateRelations(
          ficheId,
          sousThematiques,
          tx,
          ficheActionSousThematiqueTable,
          ['id'],
          ficheActionSousThematiqueTable.ficheId,
          [ficheActionSousThematiqueTable.thematiqueId]
        );
      }

      if (partenaires !== undefined) {
        await this.updateRelations(
          ficheId,
          partenaires,
          tx,
          ficheActionPartenaireTagTable,
          ['id'],
          ficheActionPartenaireTagTable.ficheId,
          [ficheActionPartenaireTagTable.partenaireTagId]
        );
      }

      if (structures !== undefined) {
        await this.updateRelations(
          ficheId,
          structures,
          tx,
          ficheActionStructureTagTable,
          ['id'],
          ficheActionStructureTagTable.ficheId,
          [ficheActionStructureTagTable.structureTagId]
        );
      }

      if (pilotes !== undefined) {
        await this.updateRelations(
          ficheId,
          pilotes,
          tx,
          ficheActionPiloteTable,
          ['tagId', 'userId'],
          ficheActionPiloteTable.ficheId,
          [ficheActionPiloteTable.tagId, ficheActionPiloteTable.userId]
        );
      }

      if (referents !== undefined) {
        await this.updateRelations(
          ficheId,
          referents,
          tx,
          ficheActionReferentTable,
          ['tagId', 'userId'],
          ficheActionReferentTable.ficheId,
          [ficheActionReferentTable.tagId, ficheActionReferentTable.userId]
        );
      }

      if (mesures !== undefined) {
        await this.updateRelations(
          ficheId,
          mesures,
          tx,
          ficheActionActionTable,
          ['id'],
          ficheActionActionTable.ficheId,
          [ficheActionActionTable.actionId]
        );
      }

      if (indicateurs !== undefined) {
        await this.updateRelations(
          ficheId,
          indicateurs,
          tx,
          ficheActionIndicateurTable,
          ['id'],
          ficheActionIndicateurTable.ficheId,
          [ficheActionIndicateurTable.indicateurId]
        );
      }

      if (services !== undefined) {
        await this.updateRelations(
          ficheId,
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
        await this.updateRelations(
          ficheId,
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
              eq(ficheActionLienTable.ficheUne, ficheId),
              eq(ficheActionLienTable.ficheDeux, ficheId)
            )
          );

        // Adds new relations to fiche action
        if (fichesLiees !== null && fichesLiees.length > 0) {
          await tx
            .insert(ficheActionLienTable)
            .values(
              fichesLiees.map((fiche) => ({
                ficheUne: ficheId,
                ficheDeux: fiche.id,
              }))
            )
            .returning();
        }
      }

      if (effetsAttendus !== undefined) {
        await this.updateRelations(
          ficheId,
          effetsAttendus,
          tx,
          ficheActionEffetAttenduTable,
          ['id'],
          ficheActionEffetAttenduTable.ficheId,
          [ficheActionEffetAttenduTable.effetAttenduId]
        );
      }

      if (libreTags !== undefined) {
        // Delete existing relations
        await tx
          .delete(ficheActionLibreTagTable)
          .where(eq(ficheActionLibreTagTable.ficheId, ficheId));

        // Insert new relations
        if (libreTags !== null && libreTags.length > 0) {
          await tx
            .insert(ficheActionLibreTagTable)
            .values(
              libreTags.map((relation) => ({
                ficheId: ficheId,
                libreTagId: relation.id,
                createdBy: user.id,
              }))
            )
            .returning();
        }
      }

      if (sharedWithCollectivites !== undefined) {
        const collectiviteIds =
          sharedWithCollectivites?.map((sharing) => sharing.id) || [];
        await this.shareFicheService.shareFiche(
          existingFicheAction,
          collectiviteIds,
          user.id,
          tx
        );
      }
    });

    const ficheActionWithRelation =
      await this.ficheActionListService.getFicheById(ficheId, true, user);

    await this.webhookService.sendWebhookNotification(
      ApplicationSousScopesEnum.FICHES,
      `${ficheId}`,
      ficheActionWithRelation
    );

    return ficheActionWithRelation;
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
    tx: Transaction,
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
}
