import { AuthenticatedUser, dcpTable } from '@/backend/auth/index-domain';
import {
  ficheActionNoteTable,
  UpsertFicheActionNote,
} from '@/backend/plans/fiches/fiche-action-note/fiche-action-note.table';
import FicheActionPermissionsService from '@/backend/plans/fiches/fiche-action-permissions.service';
import { ficheActionTable } from '@/backend/plans/fiches/shared/models/fiche-action.table';
import { DatabaseService } from '@/backend/utils';
import { buildConflictUpdateColumns } from '@/backend/utils/database/conflict.utils';
import { Injectable, Logger } from '@nestjs/common';
import { aliasedTable, and, desc, eq } from 'drizzle-orm';

@Injectable()
export default class FicheActionNoteService {
  private readonly logger = new Logger(FicheActionNoteService.name);

  constructor(
    private readonly permissionService: FicheActionPermissionsService,
    private readonly databaseService: DatabaseService
  ) {}

  /** Insère ou met à jour des notes de suivi */
  async upsertNotes(
    ficheId: number,
    notes: UpsertFicheActionNote[],
    tokenInfo: AuthenticatedUser
  ) {
    this.logger.log(
      `Vérifie les droits avant de mettre à jour les notes de la fiche ${ficheId}`
    );

    const canWrite = await this.permissionService.canWriteFiche(
      ficheId,
      tokenInfo
    );
    if (!canWrite) return false;

    this.logger.log(`Met à jour les notes de la fiche ${ficheId}`);
    return this.databaseService.db.transaction(async (trx) => {
      await trx
        .update(ficheActionTable)
        .set({
          modifiedBy: tokenInfo?.id,
          modifiedAt: new Date().toISOString(),
        })
        .where(eq(ficheActionTable.id, ficheId));

      return trx
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
            'dateNote',
            'note',
            'modifiedAt',
            'modifiedBy',
          ]),
        });
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

    const canWrite = await this.permissionService.canWriteFiche(
      ficheId,
      tokenInfo
    );
    if (!canWrite) return false;

    this.logger.log(`Supprime la note ${noteId} de la fiche ${ficheId}`);
    return this.databaseService.db.transaction(async (trx) => {
      await trx
        .update(ficheActionTable)
        .set({
          modifiedBy: tokenInfo?.id,
          modifiedAt: new Date().toISOString(),
        })
        .where(eq(ficheActionTable.id, ficheId));
      return trx
        .delete(ficheActionNoteTable)
        .where(
          and(
            eq(ficheActionNoteTable.ficheId, ficheId),
            eq(ficheActionNoteTable.id, noteId)
          )
        );
    });
  }

  /** Lit les notes de suivi attachées à la fiche */
  async getNotes(ficheId: number, tokenInfo: AuthenticatedUser) {
    const canRead = await this.permissionService.canReadFiche(
      ficheId,
      tokenInfo
    );
    if (!canRead) return false;

    const createdByDCP = aliasedTable(dcpTable, 'createdByDCP');
    const modifiedByDCP = aliasedTable(dcpTable, 'modifiedByDCP');
    const rows = await this.databaseService.db
      .select({
        id: ficheActionNoteTable.id,
        note: ficheActionNoteTable.note,
        dateNote: ficheActionNoteTable.dateNote,
        createdAt: ficheActionNoteTable.createdAt,
        modifiedAt: ficheActionNoteTable.modifiedAt,
        createdByDCP,
        modifiedByDCP,
      })
      .from(ficheActionNoteTable)
      .leftJoin(
        createdByDCP,
        eq(createdByDCP.userId, ficheActionNoteTable.createdBy)
      )
      .leftJoin(
        modifiedByDCP,
        eq(modifiedByDCP.userId, ficheActionNoteTable.modifiedBy)
      )
      .where(eq(ficheActionNoteTable.ficheId, ficheId))
      .orderBy(desc(ficheActionNoteTable.dateNote));

    return rows.map(({ createdByDCP, modifiedByDCP, ...otherCols }) => ({
      ...otherCols,
      createdBy: `${createdByDCP?.prenom} ${createdByDCP?.nom}`,
      modifiedBy: `${modifiedByDCP?.prenom} ${modifiedByDCP?.nom}`,
    }));
  }
}
