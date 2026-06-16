import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { ReferentielId } from '@tet/domain/referentiels';
import { ResourceType } from '@tet/domain/users';
import {
  PreuvesArchiveErrorEnum,
  type PreuvesArchiveError,
} from '../preuves-archive.errors';
import { PreuvesArchiveRepository } from '../preuves-archive.repository';
import type { ListPreuvesArchiveOutput } from './list-preuves-archive.output';

export interface ListPreuvesArchiveServiceInput {
  collectiviteId: number;
  referentielId: ReferentielId;
  user: AuthenticatedUser;
}

@Injectable()
export class ListPreuvesArchiveService {
  constructor(
    private readonly permissions: PermissionService,
    private readonly repository: PreuvesArchiveRepository
  ) {}

  async list(
    input: ListPreuvesArchiveServiceInput
  ): Promise<Result<ListPreuvesArchiveOutput, PreuvesArchiveError>> {
    const { collectiviteId, referentielId, user } = input;

    const isAllowed = await this.permissions.isAllowed(
      user,
      'referentiels.read',
      ResourceType.COLLECTIVITE,
      collectiviteId,
      true
    );
    if (!isAllowed) {
      return failure(
        PreuvesArchiveErrorEnum.UNAUTHORIZED,
        new Error(
          `L'utilisateur ${user.id} n'a pas le droit referentiels.read sur la collectivité ${collectiviteId}`
        )
      );
    }

    const archivesResult = await this.repository.list({
      collectiviteId,
      referentielId,
      requestedBy: user.id,
    });
    if (!archivesResult.success) {
      return archivesResult;
    }

    return success(
      archivesResult.data.map((archive) => ({
        archiveId: archive.id,
        status: archive.status,
        totalFiles: archive.totalFiles,
        processedFiles: archive.processedFiles,
        createdAt: archive.createdAt,
      }))
    );
  }
}
