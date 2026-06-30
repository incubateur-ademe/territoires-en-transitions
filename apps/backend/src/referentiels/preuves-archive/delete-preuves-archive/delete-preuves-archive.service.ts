import { Injectable, Logger } from '@nestjs/common';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { success, type Result } from '@tet/backend/utils/result.type';
import { PREUVES_ARCHIVES_BUCKET } from '../preuves-archive.constants';
import { type PreuvesArchiveError } from '../preuves-archive.errors';
import { PreuvesArchiveRepository } from '../preuves-archive.repository';
import {
  MAX_ARCHIVES_PER_AUDIT_USER,
  selectArchivesToDelete,
  type DeletableArchive,
} from './select-archives-to-delete';

export interface DeletePreuvesArchiveInput {
  auditId: number;
  requestedBy: string;
}

@Injectable()
export class DeletePreuvesArchiveService {
  private readonly logger = new Logger(DeletePreuvesArchiveService.name);

  constructor(
    private readonly repository: PreuvesArchiveRepository,
    private readonly documentStorage: DocumentStorageService
  ) {}

  async delete(
    input: DeletePreuvesArchiveInput
  ): Promise<Result<number, PreuvesArchiveError>> {
    const expired = await this.repository.deleteExpired();
    if (!expired.success) {
      return expired;
    }
    await this.removeStoredArchives(expired.data);

    const overLimit = await this.deleteArchivesOverLimit(input);
    if (!overLimit.success) {
      return overLimit;
    }

    return success(expired.data.length + overLimit.data);
  }

  private async deleteArchivesOverLimit(
    input: DeletePreuvesArchiveInput
  ): Promise<Result<number, PreuvesArchiveError>> {
    const candidates = await this.repository.listForDeletion(input);
    if (!candidates.success) {
      return candidates;
    }

    const toDelete = selectArchivesToDelete(candidates.data, {
      now: new Date(),
      keepMostRecent: MAX_ARCHIVES_PER_AUDIT_USER,
    });
    if (toDelete.length === 0) {
      return success(0);
    }

    const deleted = await this.repository.deleteByIds(
      toDelete.map((archive) => archive.id)
    );
    if (!deleted.success) {
      return deleted;
    }
    await this.removeStoredArchives(deleted.data);

    return success(deleted.data.length);
  }

  private async removeStoredArchives(
    archives: DeletableArchive[]
  ): Promise<void> {
    const storedKeys = archives.flatMap((archive) =>
      archive.storagePath !== null ? [archive.storagePath] : []
    );

    await Promise.all(
      storedKeys.map(async (key) => {
        const removed = await this.documentStorage.removeDocument({
          bucketId: PREUVES_ARCHIVES_BUCKET,
          key,
        });
        if (!removed.success) {
          this.logger.error(
            `Suppression du blob d'archive ${key} échouée: ${removed.error}`
          );
        }
      })
    );
  }
}
