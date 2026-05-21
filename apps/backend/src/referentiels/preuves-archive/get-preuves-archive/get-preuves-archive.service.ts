import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import {
  ARCHIVE_DOWNLOAD_TTL_SECONDS,
  PREUVES_ARCHIVES_BUCKET,
} from '../preuves-archive.constants';
import {
  PreuvesArchiveErrorEnum,
  type PreuvesArchiveError,
} from '../preuves-archive.errors';
import type { GetPreuvesArchiveOutput } from './get-preuves-archive.output';
import { PreuvesArchiveRepository } from '../preuves-archive.repository';
import { AuditPreuvesArchiveStatusEnum } from '../models/audit-preuves-archive.table';

export interface GetPreuvesArchiveServiceInput {
  archiveId: string;
  user: AuthenticatedUser;
}

// Message générique : le détail technique reste en DB pour les ops, jamais exposé au client.
const FAILED_ARCHIVE_PUBLIC_MESSAGE =
  "La génération de l'archive a échoué. Veuillez réessayer ou contactez le support.";

@Injectable()
export class GetPreuvesArchiveService {
  constructor(
    private readonly permissions: PermissionService,
    private readonly repository: PreuvesArchiveRepository,
    private readonly documentStorage: DocumentStorageService
  ) {}

  async get(
    input: GetPreuvesArchiveServiceInput
  ): Promise<Result<GetPreuvesArchiveOutput, PreuvesArchiveError>> {
    const { archiveId, user } = input;

    const archiveResult = await this.repository.getByIdForUser({
      id: archiveId,
      requestedBy: user.id,
    });
    if (!archiveResult.success) {
      return archiveResult;
    }
    const archive = archiveResult.data;

    // Anti-énumération : NOT_FOUND couvre la propriété, le droit perdu et l'expiration.
    const archiveNotFound = failure(
      PreuvesArchiveErrorEnum.ARCHIVE_NOT_FOUND,
      new Error(`Archive ${archiveId} non trouvée`)
    );

    const stillAllowed = await this.permissions.isAllowed(
      user,
      'referentiels.read',
      ResourceType.COLLECTIVITE,
      archive.collectiviteId,
      true
    );
    if (!stillAllowed) {
      return archiveNotFound;
    }

    const isExpired = new Date(archive.expiresAt).getTime() <= Date.now();

    let downloadUrl: string | null = null;
    if (
      archive.status === AuditPreuvesArchiveStatusEnum.COMPLETED &&
      archive.storagePath !== null &&
      !isExpired
    ) {
      const signedUrlResult = await this.documentStorage.createDocumentSignedUrl({
        bucketId: PREUVES_ARCHIVES_BUCKET,
        key: archive.storagePath,
        expiresInSeconds: ARCHIVE_DOWNLOAD_TTL_SECONDS,
      });
      if (!signedUrlResult.success) {
        return failure(
          PreuvesArchiveErrorEnum.GET_ARCHIVE_ERROR,
          signedUrlResult.cause
        );
      }
      downloadUrl = signedUrlResult.data.signedUrl;
    }

    return success({
      archiveId: archive.id,
      status: archive.status,
      totalFiles: archive.totalFiles,
      processedFiles: archive.processedFiles,
      downloadUrl,
      errorMessage:
        archive.status === AuditPreuvesArchiveStatusEnum.FAILED
          ? FAILED_ARCHIVE_PUBLIC_MESSAGE
          : null,
    });
  }
}
