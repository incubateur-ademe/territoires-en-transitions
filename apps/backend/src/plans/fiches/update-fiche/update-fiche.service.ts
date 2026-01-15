import { Injectable, Logger } from '@nestjs/common';
import { instanceGouvernanceTagTable } from '@tet/backend/collectivites/tags/instance-gouvernance-tag.table';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { ShareFicheService } from '@tet/backend/plans/fiches/share-fiches/share-fiche.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { isErrorWithCause } from '@tet/backend/utils/nest/errors.utils';
import { WebhookService } from '@tet/backend/utils/webhooks/webhook.service';
import {
  canLinkInstanceGouvernanceToFiche,
  ficheSchemaUpdate,
  FicheWithRelations,
} from '@tet/domain/plans';
import { ApplicationSousScopesEnum } from '@tet/domain/utils';
import {
  Column,
  ColumnBaseConfig,
  ColumnDataType,
  eq,
  inArray,
  or,
  TableConfig,
} from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import { isNil, partition } from 'es-toolkit';
import { toCamel } from 'ts-case-convert';
import { AuthenticatedUser } from '../../../users/models/auth.models';
import { ficheActionNoteTable } from '../fiche-action-note/fiche-action-note.table';
import FicheActionPermissionsService from '../fiche-action-permissions.service';
import { NotifyPiloteService } from '../notify-pilote/notify-pilote.service';
import { ficheActionActionImpactTable } from '../shared/models/fiche-action-action-impact.table';
import { ficheActionActionTable } from '../shared/models/fiche-action-action.table';
import { ficheActionAxeTable } from '../shared/models/fiche-action-axe.table';
import { ficheActionEffetAttenduTable } from '../shared/models/fiche-action-effet-attendu.table';
import { ficheActionFinanceurTagTable } from '../shared/models/fiche-action-financeur-tag.table';
import { ficheActionIndicateurTable } from '../shared/models/fiche-action-indicateur.table';
import { ficheActionInstanceGouvernanceTableTag } from '../shared/models/fiche-action-instance-gouvernance';
import { ficheActionLibreTagTable } from '../shared/models/fiche-action-libre-tag.table';
import { ficheActionLienTable } from '../shared/models/fiche-action-lien.table';
import { ficheActionPartenaireTagTable } from '../shared/models/fiche-action-partenaire-tag.table';
import { ficheActionPiloteTable } from '../shared/models/fiche-action-pilote.table';
import { ficheActionReferentTable } from '../shared/models/fiche-action-referent.table';
import { ficheActionServiceTagTable } from '../shared/models/fiche-action-service-tag.table';
import { ficheActionSousThematiqueTable } from '../shared/models/fiche-action-sous-thematique.table';
import { ficheActionStructureTagTable } from '../shared/models/fiche-action-structure-tag.table';
import { ficheActionThematiqueTable } from '../shared/models/fiche-action-thematique.table';
import { ficheActionTable } from '../shared/models/fiche-action.table';
import {
  UpdateFicheError,
  UpdateFicheErrorEnum,
  UpdateFicheValidationError,
} from './update-fiche.errors';
import { UpdateFicheInput } from './update-fiche.input';
import { UpdateFicheResult } from './update-fiche.result';

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
  | { ficheId: number | string; actionImpactId: number }
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
    private readonly shareFicheService: ShareFicheService,
    private readonly notificationsFicheService: NotifyPiloteService
  ) {}

  async updateFiche({
    ficheId,
    ficheFields,
    isNotificationEnabled,
    user,
    tx,
  }: {
    ficheId: number;
    ficheFields: UpdateFicheInput;
    isNotificationEnabled?: boolean;
    user: AuthenticatedUser;
    tx?: Transaction;
  }): Promise<UpdateFicheResult<FicheWithRelations, UpdateFicheError>> {
    await this.fichePermissionService.canWriteFiche(ficheId, user, tx);
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
      notes,
      sharedWithCollectivites,
      instanceGouvernance,
      actionsImpact,
      tempsDeMiseEnOeuvre,
      ...unsafeFicheAction
    } = ficheFields;

    // Removes all props that are not in the schema
    const ficheAction = ficheSchemaUpdate.parse(unsafeFicheAction);

    // Validate parentId before transaction
    if (!isNil(unsafeFicheAction.parentId)) {
      if (unsafeFicheAction.parentId === ficheId) {
        return {
          success: false,
          error: UpdateFicheErrorEnum.SELF_REFERENCE,
        };
      }

      const resultGetParentFiche =
        await this.ficheActionListService.getFicheById(
          unsafeFicheAction.parentId,
          false,
          user,
          tx
        );
      if (!resultGetParentFiche.success) {
        this.logger.error(resultGetParentFiche.error);
        return {
          success: false,
          error: UpdateFicheErrorEnum.PARENT_NOT_FOUND,
        };
      }
    }

    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<
      UpdateFicheResult<{ ficheUpdated: FicheWithRelations }, UpdateFicheError>
    > => {
      const resultGetExistingFiche =
        await this.ficheActionListService.getFicheById(
          ficheId,
          false,
          user,
          transaction
        );
      if (!resultGetExistingFiche.success) {
        this.logger.error(resultGetExistingFiche.error);
        return {
          success: false,
          error: UpdateFicheErrorEnum.FICHE_NOT_FOUND,
        };
      }
      const existingFicheAction = resultGetExistingFiche.data;

      if (Object.keys(ficheFields).length > 0) {
        await transaction
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
          transaction,
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
          transaction,
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
          transaction,
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
          transaction,
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
          transaction,
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
          transaction,
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
          transaction,
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
          transaction,
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
          transaction,
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
          transaction,
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
          transaction,
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
        await transaction
          .delete(ficheActionLienTable)
          .where(
            or(
              eq(ficheActionLienTable.ficheUne, ficheId),
              eq(ficheActionLienTable.ficheDeux, ficheId)
            )
          );

        // Adds new relations to fiche action
        if (fichesLiees !== null && fichesLiees.length > 0) {
          await transaction
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
          transaction,
          ficheActionEffetAttenduTable,
          ['id'],
          ficheActionEffetAttenduTable.ficheId,
          [ficheActionEffetAttenduTable.effetAttenduId]
        );
      }

      if (instanceGouvernance !== undefined) {
        await this.validateAndUpdateInstanceGouvernance({
          ficheId,
          instanceGouvernance,
          collectiviteId: existingFicheAction.collectiviteId,
          userId: user.id,
          transaction,
        });
      }

      if (libreTags !== undefined) {
        // Delete existing relations
        await transaction
          .delete(ficheActionLibreTagTable)
          .where(eq(ficheActionLibreTagTable.ficheId, ficheId));

        // Insert new relations
        if (libreTags !== null && libreTags.length > 0) {
          await transaction
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

      if (actionsImpact !== undefined) {
        await this.updateRelations(
          ficheId,
          actionsImpact,
          transaction,
          ficheActionActionImpactTable,
          ['id'],
          ficheActionActionImpactTable.ficheId,
          [ficheActionActionImpactTable.actionImpactId]
        );
      }

      await this.updateNotes({
        ficheId,
        notes,
        existingFicheAction,
        user,
        transaction,
      });

      if (sharedWithCollectivites !== undefined) {
        const collectiviteIds =
          sharedWithCollectivites?.map((sharing) => sharing.id) || [];
        await this.shareFicheService.shareFiche(
          existingFicheAction,
          collectiviteIds,
          user.id,
          transaction
        );
      }

      // Recharge la fiche mise à jour
      const updatedFiche = await this.ficheActionListService.getFicheById(
        ficheId,
        true,
        user,
        transaction
      );
      if (!updatedFiche.success) {
        return { success: false, error: UpdateFicheErrorEnum.FICHE_NOT_FOUND };
      }

      // Ajoute les notifications pour les pilotes nouvellement associés à une sous-fiche
      if (isNotificationEnabled) {
        await this.notificationsFicheService.upsertPiloteNotificationsBulk({
          fichesPairs: [
            {
              updatedFiche: updatedFiche.data,
              previousFiche: existingFicheAction,
            },
          ],
          user,
          tx: transaction,
        });
      }

      return {
        success: true,
        data: {
          ficheUpdated: updatedFiche.data,
        },
      };
    };

    try {
      const resultUpdate = await (tx
        ? executeInTransaction(tx)
        : this.databaseService.db.transaction((newTx) =>
            executeInTransaction(newTx)
          ));
      if (!resultUpdate.success) {
        return { success: false, error: resultUpdate.error };
      }
      const updatedFiche = resultUpdate.data.ficheUpdated;

      try {
        await this.webhookService.sendWebhookNotification(
          ApplicationSousScopesEnum.FICHES,
          `${ficheId}`,
          updatedFiche
        );
      } catch (webhookError) {
        this.logger.error(
          `Webhook notification failed for fiche ${ficheId}`,
          webhookError instanceof Error ? webhookError.stack : webhookError
        );
      }

      return {
        success: true,
        data: updatedFiche,
      };
    } catch (error) {
      if (error instanceof UpdateFicheValidationError) {
        return { success: false, error: error.ficheError };
      }
      if (isErrorWithCause(error)) {
        this.logger.error(
          `Error cause: ${error.cause.message} (${error.cause.code}, ${error.cause.constraint})`
        );
        this.logger.debug(`Error cause stack: ${error.cause.stack}`);
      }
      return {
        success: false,
        error: 'SERVER_ERROR',
        cause: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  private async updateNotes({
    ficheId,
    notes,
    existingFicheAction,
    user,
    transaction,
  }: {
    ficheId: number;
    notes: UpdateFicheInput['notes'];
    existingFicheAction: FicheWithRelations;
    user: AuthenticatedUser;
    transaction: Transaction;
  }) {
    if (!notes) {
      return;
    }

    const notesToDelete = (existingFicheAction.notes ?? []).filter(
      (note) => !notes.some((n) => n.id === note.id)
    );

    if (notesToDelete.length > 0) {
      await Promise.all(
        notesToDelete.map(async (note) => {
          await transaction
            .delete(ficheActionNoteTable)
            .where(eq(ficheActionNoteTable.id, note.id as number));
        })
      );
    }

    const [maybeNotesToUpdate, notesToCreate] = partition(
      notes,
      (note) => note.id !== undefined
    );

    const notesToUpdate = maybeNotesToUpdate.filter((note) => {
      const existingNoteInDB = existingFicheAction.notes?.find(
        (n) => n.id === note.id
      );
      if (!existingNoteInDB) {
        return false;
      }
      const mustBeUpdated =
        existingNoteInDB.dateNote !== note.dateNote ||
        existingNoteInDB.note !== note.note;
      return mustBeUpdated;
    });

    if (notesToUpdate.length > 0) {
      await Promise.all(
        notesToUpdate.map(async (note) => {
          await transaction
            .update(ficheActionNoteTable)
            .set({
              note: note.note,
              dateNote: note.dateNote,
              modifiedBy: user.id,
              modifiedAt: new Date().toISOString(),
            })
            .where(eq(ficheActionNoteTable.id, note.id as number));
        })
      );
    }

    if (notesToCreate.length > 0) {
      await Promise.all(
        notesToCreate.map(async (note) => {
          await transaction
            .insert(ficheActionNoteTable)
            .values({
              ficheId: ficheId,
              dateNote: note.dateNote,
              note: note.note,
              createdBy: user.id,
              modifiedBy: user.id,
            })
            .returning();
        })
      );
    }
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

  private async validateAndUpdateInstanceGouvernance({
    ficheId,
    instanceGouvernance,
    collectiviteId,
    userId,
    transaction,
  }: {
    ficheId: number;
    instanceGouvernance: { id: number }[] | null;
    collectiviteId: number;
    userId: string;
    transaction: Transaction;
  }) {
    await transaction
      .delete(ficheActionInstanceGouvernanceTableTag)
      .where(eq(ficheActionInstanceGouvernanceTableTag.ficheId, ficheId));

    if (!instanceGouvernance || instanceGouvernance.length === 0) {
      return;
    }

    const tagIds = instanceGouvernance.map((relation) => relation.id);
    const tags = await transaction
      .select({
        id: instanceGouvernanceTagTable.id,
        collectiviteId: instanceGouvernanceTagTable.collectiviteId,
      })
      .from(instanceGouvernanceTagTable)
      .where(inArray(instanceGouvernanceTagTable.id, tagIds));

    const foundIds = tags.map((tag) => tag.id);
    const missingIds = tagIds.filter((id) => !foundIds.includes(id));
    if (missingIds.length > 0) {
      throw new UpdateFicheValidationError(
        'INSTANCE_GOUVERNANCE_TAG_NOT_FOUND'
      );
    }

    const hasMismatch = tags.some(
      (tag) =>
        !canLinkInstanceGouvernanceToFiche({
          ficheCollectiviteId: collectiviteId,
          instanceGouvernanceCollectiviteId: tag.collectiviteId,
        })
    );
    if (hasMismatch) {
      throw new UpdateFicheValidationError(
        'INSTANCE_GOUVERNANCE_COLLECTIVITE_MISMATCH'
      );
    }

    await transaction
      .insert(ficheActionInstanceGouvernanceTableTag)
      .values(
        instanceGouvernance.map((relation) => ({
          ficheId,
          instanceGouvernanceTagId: relation.id,
          createdBy: userId,
        }))
      )
      .returning();
  }
}
