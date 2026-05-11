import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, Result } from '@tet/backend/utils/result.type';
import {
  CommonError,
  CommonErrorEnum,
} from '@tet/backend/utils/trpc/common-errors';
import { PreuveBase } from '@tet/domain/collectivites';
import { ResourceType } from '@tet/domain/users';
import { EditPreuveDocumentError } from './edit-preuve-document.errors';
import {
  RemovePreuveInput,
  UpdatePreuveInput,
} from './edit-preuve-document.input';
import { EditPreuveDocumentRepository } from './edit-preuve-document.repository';

@Injectable()
export class EditPreuveDocumentService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly editPreuveDocumentRepository: EditPreuveDocumentRepository
  ) {}

  async updatePreuve(
    input: UpdatePreuveInput,
    user: AuthenticatedUser
  ): Promise<Result<PreuveBase, EditPreuveDocumentError>> {
    const { preuveId, preuveType, lien, commentaire } = input;

    const preuve = await this.editPreuveDocumentRepository.findById(
      preuveType,
      preuveId
    );
    if (!preuve) {
      return failure(CommonErrorEnum.NOT_FOUND);
    }

    const isAllowed = await this.permissionService.isAllowed(
      user,
      'collectivites.documents.mutate',
      ResourceType.COLLECTIVITE,
      preuve.collectiviteId,
      true
    );
    if (!isAllowed) {
      return failure(CommonErrorEnum.UNAUTHORIZED);
    }

    if (preuve.fichierId != null && lien !== undefined) {
      return failure('PREUVE_FICHIER');
    }

    return this.editPreuveDocumentRepository.updateById(
      preuveType,
      preuveId,
      user.id,
      { lien, commentaire }
    );
  }

  async removePreuve(
    input: RemovePreuveInput,
    user: AuthenticatedUser
  ): Promise<Result<{ id: number }, CommonError>> {
    const { preuveId, preuveType } = input;

    const preuve = await this.editPreuveDocumentRepository.findById(
      preuveType,
      preuveId
    );
    if (!preuve) {
      return failure(CommonErrorEnum.NOT_FOUND);
    }

    const isAllowed = await this.permissionService.isAllowed(
      user,
      'collectivites.documents.mutate',
      ResourceType.COLLECTIVITE,
      preuve.collectiviteId,
      true
    );
    if (!isAllowed) {
      return failure(CommonErrorEnum.UNAUTHORIZED);
    }

    return this.editPreuveDocumentRepository.deleteById(preuveType, preuveId);
  }
}
