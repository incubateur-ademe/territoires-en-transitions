import { Injectable } from '@nestjs/common';
import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { FicheNote, FicheNoteUpsert } from '@tet/domain/plans';
import { NoteResult } from './fiche-action-note.types';
import { FicheActionNoteRepository } from './fiche-action-note.repository';

@Injectable()
export class FicheActionNoteService {
  constructor(
    private readonly noteRepository: FicheActionNoteRepository,
    private readonly permissionService: FicheActionPermissionsService,
    private readonly databaseService: DatabaseService
  ) {}

  async getNotes(
    ficheId: number,
    tokenInfo: AuthenticatedUser
  ): Promise<NoteResult<FicheNote[]>> {
    const canRead = await this.permissionService.canReadFiche(
      ficheId,
      tokenInfo
    );
    if (!canRead) {
      return { success: false, error: 'UNAUTHORIZED' };
    }

    return this.noteRepository.list(ficheId);
  }

  async upsertNotes(
    ficheId: number,
    notes: FicheNoteUpsert[],
    tokenInfo: AuthenticatedUser
  ): Promise<NoteResult<void>> {
    const canWrite = await this.permissionService.canWriteFiche(
      ficheId,
      tokenInfo
    );
    if (!canWrite) {
      return { success: false, error: 'UNAUTHORIZED' };
    }

    const result = await this.databaseService.db.transaction(async (tx) => {
      const updateFicheResult =
        await this.noteRepository.updateFicheModification(
          ficheId,
          tokenInfo.id,
          tx
        );
      if (!updateFicheResult.success) {
        return updateFicheResult;
      }

      return this.noteRepository.upsert(ficheId, notes, tokenInfo.id, tx);
    });

    return result;
  }

  async deleteNote(
    ficheId: number,
    noteId: number,
    tokenInfo: AuthenticatedUser
  ): Promise<NoteResult<void>> {
    const canWrite = await this.permissionService.canWriteFiche(
      ficheId,
      tokenInfo
    );
    if (!canWrite) {
      return { success: false, error: 'UNAUTHORIZED' };
    }

    const result = await this.databaseService.db.transaction(async (tx) => {
      const updateFicheResult =
        await this.noteRepository.updateFicheModification(
          ficheId,
          tokenInfo.id,
          tx
        );
      if (!updateFicheResult.success) {
        return updateFicheResult;
      }

      return this.noteRepository.delete(ficheId, noteId, tx);
    });

    return result;
  }
}
