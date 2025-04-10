import FicheActionListService from '@/backend/plans/fiches/fiches-action-list.service';
import { DatabaseService } from '@/backend/utils';
import { ApplicationSousScopesEnum } from '@/backend/utils/application-domains.enum';
import { WebhookService } from '@/backend/utils/webhooks/webhook.service';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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
import { AuthenticatedUser } from '../../auth/models/auth.models';
import FicheActionPermissionsService from './fiche-action-permissions.service';
import { UpdateFicheActionRequestType } from './shared/edit-fiche.request';
import { ficheActionActionTable } from './shared/models/fiche-action-action.table';
import { ficheActionAxeTable } from './shared/models/fiche-action-axe.table';
import { ficheActionEffetAttenduTable } from './shared/models/fiche-action-effet-attendu.table';
import { ficheActionFinanceurTagTable } from './shared/models/fiche-action-financeur-tag.table';
import { ficheActionIndicateurTable } from './shared/models/fiche-action-indicateur.table';
import { ficheActionLibreTagTable } from './shared/models/fiche-action-libre-tag.table';
import { ficheActionLienTable } from './shared/models/fiche-action-lien.table';
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
import { Transaction } from '@/backend/utils/database/transaction.utils';

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
    private readonly webhookService: WebhookService,
    private readonly ficheActionListService: FicheActionListService,
    private readonly ficheService: FicheActionPermissionsService
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

    const updatedFicheAction = await this.databaseService.rls(user)(
      async (tx) => {
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
            .set({
              ...ficheAction,
              modifiedBy: user.id,
              modifiedAt: new Date().toISOString(),
            })
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

        const finalFicheAction = {
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

        return finalFicheAction;
      }
    );

    // TODO: return ficheActionWithRelation to have full object
    const ficheActionWithRelation =
      await this.ficheActionListService.getFicheActionById(ficheActionId, true);

    await this.webhookService.sendWebhookNotification(
      ApplicationSousScopesEnum.FICHES,
      `${ficheActionId}`,
      ficheActionWithRelation
    );

    return updatedFicheAction;
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
