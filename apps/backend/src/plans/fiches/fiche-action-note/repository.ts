import { Injectable, Logger } from '@nestjs/common';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { buildConflictUpdateColumns } from '@tet/backend/utils/database/conflict.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { FicheNote, FicheNoteUpsert } from '@tet/domain/plans';
import { aliasedTable, and, desc, eq } from 'drizzle-orm';
import { ficheActionNoteTable } from './table';
import type { NoteResult } from './types';

@Injectable()
export class FicheActionNoteRepository {
  private readonly logger = new Logger(FicheActionNoteRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async list(ficheId: number): Promise<NoteResult<FicheNote[]>> {
    try {
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

      const notes = rows.map(
        ({ createdByDCP, modifiedByDCP, ...otherCols }) => ({
          ...otherCols,
          createdBy: createdByDCP
            ? `${createdByDCP.prenom ?? ''} ${createdByDCP.nom ?? ''}`.trim()
            : null,
          modifiedBy: modifiedByDCP
            ? `${modifiedByDCP.prenom ?? ''} ${modifiedByDCP.nom ?? ''}`.trim()
            : null,
        })
      );

      return { success: true, data: notes };
    } catch (error) {
      this.logger.error(`Error listing notes for fiche ${ficheId}: ${error}`);
      return { success: false, error: 'SERVER_ERROR', cause: error as Error };
    }
  }

  async upsert(
    ficheId: number,
    notes: FicheNoteUpsert[],
    userId: string,
    tx?: Transaction
  ): Promise<NoteResult<void>> {
    try {
      const db = tx ?? this.databaseService.db;

      await db
        .insert(ficheActionNoteTable)
        .values(
          notes.map((note) => ({
            ...note,
            ficheId,
            createdBy: userId,
            modifiedBy: userId,
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

      return { success: true, data: undefined };
    } catch (error) {
      this.logger.error(`Error upserting notes for fiche ${ficheId}: ${error}`);
      return { success: false, error: 'SERVER_ERROR', cause: error as Error };
    }
  }

  async delete(
    ficheId: number,
    noteId: number,
    tx?: Transaction
  ): Promise<NoteResult<void>> {
    try {
      const db = tx ?? this.databaseService.db;

      await db
        .delete(ficheActionNoteTable)
        .where(
          and(
            eq(ficheActionNoteTable.ficheId, ficheId),
            eq(ficheActionNoteTable.id, noteId)
          )
        );

      return { success: true, data: undefined };
    } catch (error) {
      this.logger.error(
        `Error deleting note ${noteId} for fiche ${ficheId}: ${error}`
      );
      return { success: false, error: 'SERVER_ERROR' };
    }
  }

  async updateFicheModification(
    ficheId: number,
    userId: string,
    tx?: Transaction
  ): Promise<NoteResult<void>> {
    try {
      const db = tx ?? this.databaseService.db;

      await db
        .update(ficheActionTable)
        .set({
          modifiedBy: userId,
          modifiedAt: new Date().toISOString(),
        })
        .where(eq(ficheActionTable.id, ficheId));

      return { success: true, data: undefined };
    } catch (error) {
      this.logger.error(
        `Error updating fiche modification for fiche ${ficheId}: ${error}`
      );
      return { success: false, error: 'SERVER_ERROR' };
    }
  }
}
