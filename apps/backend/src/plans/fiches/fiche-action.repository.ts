import { Injectable, Logger } from '@nestjs/common';
import { instanceGouvernanceTagTable } from '@tet/backend/collectivites/tags/instance-gouvernance-tag.table';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { isErrorWithCause } from '@tet/backend/utils/nest/errors.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  canLinkInstanceGouvernanceToFiche,
  Fiche,
  FicheCreate,
  ficheSchemaUpdate,
  FicheWithRelations,
} from '@tet/domain/plans';
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
import { partition } from 'es-toolkit';
import { toCamel } from 'ts-case-convert';
import { AuthenticatedUser } from '../../users/models/auth.models';
import { ficheActionNoteTable } from './fiche-action-note/fiche-action-note.table';
import { ficheActionActionImpactTable } from './shared/models/fiche-action-action-impact.table';
import { ficheActionActionTable } from './shared/models/fiche-action-action.table';
import { ficheActionAxeTable } from './shared/models/fiche-action-axe.table';
import { ficheActionEffetAttenduTable } from './shared/models/fiche-action-effet-attendu.table';
import { ficheActionFinanceurTagTable } from './shared/models/fiche-action-financeur-tag.table';
import { ficheActionIndicateurTable } from './shared/models/fiche-action-indicateur.table';
import { ficheActionInstanceGouvernanceTableTag } from './shared/models/fiche-action-instance-gouvernance';
import { ficheActionLibreTagTable } from './shared/models/fiche-action-libre-tag.table';
import { ficheActionLienTable } from './shared/models/fiche-action-lien.table';
import { ficheActionPartenaireTagTable } from './shared/models/fiche-action-partenaire-tag.table';
import { ficheActionPiloteTable } from './shared/models/fiche-action-pilote.table';
import { ficheActionReferentTable } from './shared/models/fiche-action-referent.table';
import { ficheActionServiceTagTable } from './shared/models/fiche-action-service-tag.table';
import { ficheActionSousThematiqueTable } from './shared/models/fiche-action-sous-thematique.table';
import { ficheActionStructureTagTable } from './shared/models/fiche-action-structure-tag.table';
import { ficheActionThematiqueTable } from './shared/models/fiche-action-thematique.table';
import { ficheActionTable } from './shared/models/fiche-action.table';
import { UpdateFicheInput } from './update-fiche/update-fiche.input';

export type FicheActionWriteError =
  | 'INSTANCE_GOUVERNANCE_COLLECTIVITE_MISMATCH'
  | 'INSTANCE_GOUVERNANCE_TAG_NOT_FOUND'
  | 'SERVER_ERROR';

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
export class FicheActionRepository {
  private readonly logger = new Logger(FicheActionRepository.name);

  async applyCreate({
    fiche,
    ficheFields,
    user,
    tx,
  }: {
    fiche: FicheCreate;
    ficheFields?: UpdateFicheInput;
    user: AuthenticatedUser;
    tx: Transaction;
  }): Promise<Result<{ id: number; fiche: Fiche }, FicheActionWriteError>> {
    try {
      const [created] = await tx
        .insert(ficheActionTable)
        .values({
          ...fiche,
          createdBy: user.id,
          modifiedBy: user.id,
        })
        .returning();
      if (!created) {
        return failure('SERVER_ERROR');
      }

      if (ficheFields) {
        const applyResult = await this.applyUpdate({
          ficheId: created.id,
          ficheFields,
          existingFiche: {
            id: created.id,
            collectiviteId: fiche.collectiviteId,
            notes: null,
          },
          user,
          tx,
        });
        if (!applyResult.success) return applyResult;
      }

      return success({ id: created.id, fiche: created });
    } catch (error) {
      return this.toServerError(error);
    }
  }

  async applyUpdate({
    ficheId,
    ficheFields,
    existingFiche,
    user,
    tx,
  }: {
    ficheId: number;
    ficheFields: UpdateFicheInput;
    existingFiche: Pick<FicheWithRelations, 'id' | 'collectiviteId' | 'notes'>;
    user: AuthenticatedUser;
    tx: Transaction;
  }): Promise<Result<void, FicheActionWriteError>> {
    // `sharedWithCollectivites` est exclu : le partage cross-collectivité est
    // orchestré par le service consommateur, pas par le repo.
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
      instanceGouvernance,
      actionsImpact,
      tempsDeMiseEnOeuvre,
      sharedWithCollectivites: _sharedWithCollectivites,
      ...unsafeFicheAction
    } = ficheFields;

    const ficheAction = ficheSchemaUpdate.parse(unsafeFicheAction);

    try {
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
        await tx
          .delete(ficheActionLienTable)
          .where(
            or(
              eq(ficheActionLienTable.ficheUne, ficheId),
              eq(ficheActionLienTable.ficheDeux, ficheId)
            )
          );

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

      if (instanceGouvernance !== undefined) {
        const result = await this.validateAndUpdateInstanceGouvernance({
          ficheId,
          instanceGouvernance,
          collectiviteId: existingFiche.collectiviteId,
          userId: user.id,
          tx,
        });
        if (!result.success) return result;
      }

      if (libreTags !== undefined) {
        await tx
          .delete(ficheActionLibreTagTable)
          .where(eq(ficheActionLibreTagTable.ficheId, ficheId));

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

      if (actionsImpact !== undefined) {
        await this.updateRelations(
          ficheId,
          actionsImpact,
          tx,
          ficheActionActionImpactTable,
          ['id'],
          ficheActionActionImpactTable.ficheId,
          [ficheActionActionImpactTable.actionImpactId]
        );
      }

      await this.updateNotes({
        ficheId,
        notes,
        existingNotes: existingFiche.notes,
        user,
        tx,
      });

      return success(undefined);
    } catch (error) {
      return this.toServerError(error);
    }
  }

  private toServerError(
    error: unknown
  ): Result<never, FicheActionWriteError> {
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

  private async updateNotes({
    ficheId,
    notes,
    existingNotes,
    user,
    tx,
  }: {
    ficheId: number;
    notes: UpdateFicheInput['notes'];
    existingNotes: FicheWithRelations['notes'];
    user: AuthenticatedUser;
    tx: Transaction;
  }) {
    if (!notes) return;

    const notesToDelete = (existingNotes ?? []).filter(
      (note) => !notes.some((n) => n.id === note.id)
    );

    if (notesToDelete.length > 0) {
      await Promise.all(
        notesToDelete.map(async (note) => {
          await tx
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
      const existingNoteInDB = existingNotes?.find((n) => n.id === note.id);
      if (!existingNoteInDB) return false;
      return (
        existingNoteInDB.dateNote !== note.dateNote ||
        existingNoteInDB.note !== note.note
      );
    });

    if (notesToUpdate.length > 0) {
      await Promise.all(
        notesToUpdate.map(async (note) => {
          await tx
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
          await tx
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

    await tx.delete(table).where(eq(ficheIdColumn, ficheActionId));

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
    return values.map((value) => {
      const relationObject: Partial<RelationObjectType> = {
        [toCamel(ficheIdColumn.name) as keyof RelationObjectType]:
          ficheActionId,
      };

      if (Array.isArray(value)) {
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
    tx,
  }: {
    ficheId: number;
    instanceGouvernance: { id: number }[] | null;
    collectiviteId: number;
    userId: string;
    tx: Transaction;
  }): Promise<Result<void, FicheActionWriteError>> {
    await tx
      .delete(ficheActionInstanceGouvernanceTableTag)
      .where(eq(ficheActionInstanceGouvernanceTableTag.ficheId, ficheId));

    if (!instanceGouvernance || instanceGouvernance.length === 0) {
      return success(undefined);
    }

    const tagIds = instanceGouvernance.map((relation) => relation.id);
    const tags = await tx
      .select({
        id: instanceGouvernanceTagTable.id,
        collectiviteId: instanceGouvernanceTagTable.collectiviteId,
      })
      .from(instanceGouvernanceTagTable)
      .where(inArray(instanceGouvernanceTagTable.id, tagIds));

    const foundIds = tags.map((tag) => tag.id);
    const missingIds = tagIds.filter((id) => !foundIds.includes(id));
    if (missingIds.length > 0) {
      return failure('INSTANCE_GOUVERNANCE_TAG_NOT_FOUND');
    }

    const hasMismatch = tags.some(
      (tag) =>
        !canLinkInstanceGouvernanceToFiche({
          ficheCollectiviteId: collectiviteId,
          instanceGouvernanceCollectiviteId: tag.collectiviteId,
        })
    );
    if (hasMismatch) {
      return failure('INSTANCE_GOUVERNANCE_COLLECTIVITE_MISMATCH');
    }

    await tx
      .insert(ficheActionInstanceGouvernanceTableTag)
      .values(
        instanceGouvernance.map((relation) => ({
          ficheId,
          instanceGouvernanceTagId: relation.id,
          createdBy: userId,
        }))
      )
      .returning();

    return success(undefined);
  }
}
