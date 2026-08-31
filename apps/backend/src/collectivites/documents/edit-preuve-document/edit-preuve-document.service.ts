import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, Result } from '@tet/backend/utils/result.type';
import { CommonErrorEnum } from '@tet/backend/utils/trpc/common-errors';
import { PreuveBase, PreuveType } from '@tet/domain/collectivites';
import {
  canModifyCandidatureDocuments,
  getReferentielIdFromActionId,
} from '@tet/domain/referentiels';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import {
  EditPreuveDocumentError,
  EditPreuveDocumentErrorEnum,
} from './edit-preuve-document.errors';
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

  private async assertComplementairePreuveWritable(
    preuveType: PreuveType,
    preuveId: number,
    collectiviteId: number,
    user: AuthenticatedUser
  ): Promise<EditPreuveDocumentError | undefined> {
    if (preuveType !== 'complementaire') {
      return undefined;
    }
    const actionId =
      await this.editPreuveDocumentRepository.findComplementaireActionId(
        preuveId
      );
    if (!actionId) {
      return CommonErrorEnum.NOT_FOUND;
    }
    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.MUTATE'],
      ResourceType.REFERENTIEL,
      {
        collectiviteId,
        referentielId: getReferentielIdFromActionId(actionId),
      }
    );
    if (!permissionResult.success) {
      return permissionResult.error;
    }
    return undefined;
  }

  async updatePreuve(
    input: UpdatePreuveInput,
    user: AuthenticatedUser
  ): Promise<Result<PreuveBase, EditPreuveDocumentError>> {
    const { preuveId, preuveType, lien, commentaire, objet } = input;

    const preuve = await this.editPreuveDocumentRepository.findById(
      preuveType,
      preuveId
    );
    if (!preuve) {
      return failure(CommonErrorEnum.NOT_FOUND);
    }

    const permissionResult = await this.permissionService.isAllowed(
      user,
      'collectivites.documents.mutate',
      ResourceType.COLLECTIVITE,
      { collectiviteId: preuve.collectiviteId }
    );
    if (!permissionResult.success) {
      return failure(CommonErrorEnum.UNAUTHORIZED);
    }

    const modeError = await this.assertComplementairePreuveWritable(
      preuveType,
      preuveId,
      preuve.collectiviteId,
      user
    );
    if (modeError) {
      return failure(modeError);
    }

    if (objet !== undefined) {
      const objetPermissionResult = await this.permissionService.isAllowed(
        user,
        'collectivites.documents.mutate_objet',
        ResourceType.COLLECTIVITE,
        { collectiviteId: preuve.collectiviteId }
      );
      if (!objetPermissionResult.success) {
        return failure(CommonErrorEnum.UNAUTHORIZED);
      }
    }

    const isEditingLienOrCommentaire =
      lien !== undefined || commentaire !== undefined;
    if (isEditingLienOrCommentaire) {
      const isPreuveEditable = await this.canModifyPreuve(preuveType, preuveId);
      if (!isPreuveEditable) {
        return failure(EditPreuveDocumentErrorEnum.LABELLISATION_IN_PROGRESS);
      }
    }

    if (preuve.fichierId != null && lien !== undefined) {
      return failure(EditPreuveDocumentErrorEnum.PREUVE_FICHIER);
    }

    return this.editPreuveDocumentRepository.updateById(
      preuveId,
      user.id,
      input
    );
  }

  async removePreuve(
    input: RemovePreuveInput,
    user: AuthenticatedUser
  ): Promise<Result<{ id: number }, EditPreuveDocumentError>> {
    const { preuveId, preuveType } = input;

    const preuve = await this.editPreuveDocumentRepository.findById(
      preuveType,
      preuveId
    );
    if (!preuve) {
      return failure(CommonErrorEnum.NOT_FOUND);
    }

    const permissionResult = await this.permissionService.isAllowed(
      user,
      'collectivites.documents.mutate',
      ResourceType.COLLECTIVITE,
      { collectiviteId: preuve.collectiviteId }
    );
    if (!permissionResult.success) {
      return failure(CommonErrorEnum.UNAUTHORIZED);
    }

    const modeError = await this.assertComplementairePreuveWritable(
      preuveType,
      preuveId,
      preuve.collectiviteId,
      user
    );
    if (modeError) {
      return failure(modeError);
    }

    if (!(await this.canModifyPreuve(preuveType, preuveId))) {
      return failure(EditPreuveDocumentErrorEnum.LABELLISATION_IN_PROGRESS);
    }

    return this.editPreuveDocumentRepository.deleteById(preuveType, preuveId);
  }

  private async canModifyPreuve(
    preuveType: PreuveType,
    preuveId: number
  ): Promise<boolean> {
    if (preuveType !== 'labellisation') {
      return true;
    }
    const audit =
      await this.editPreuveDocumentRepository.findAuditByLabellisationPreuve(
        preuveId
      );
    return canModifyCandidatureDocuments({ audit });
  }
}
