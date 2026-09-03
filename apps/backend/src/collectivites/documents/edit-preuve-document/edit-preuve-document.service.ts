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
    const { preuveId, preuveType, lien, commentaire } = input;

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

    const isEditingLienOrCommentaire =
      lien !== undefined || commentaire !== undefined;
    if (isEditingLienOrCommentaire) {
      const isPreuveEditable = await this.canModifyPreuve({
        preuveType,
        preuveId,
        collectiviteId: preuve.collectiviteId,
        user,
      });
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

    const isPreuveRemovable = await this.canModifyPreuve({
      preuveType,
      preuveId,
      collectiviteId: preuve.collectiviteId,
      user,
    });
    if (!isPreuveRemovable) {
      return failure(EditPreuveDocumentErrorEnum.LABELLISATION_IN_PROGRESS);
    }

    return this.editPreuveDocumentRepository.deleteById(preuveType, preuveId);
  }

  private async canMutateLabellisationDocuments(
    user: AuthenticatedUser,
    collectiviteId: number
  ): Promise<boolean> {
    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum[
        'REFERENTIELS.LABELLISATIONS.MUTATE_DOCUMENTS'
      ],
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );
    return permissionResult.success;
  }

  private async canModifyPreuve({
    preuveType,
    preuveId,
    collectiviteId,
    user,
  }: {
    preuveType: PreuveType;
    preuveId: number;
    collectiviteId: number;
    user: AuthenticatedUser;
  }): Promise<boolean> {
    if (preuveType !== 'labellisation') {
      return true;
    }
    const audit =
      await this.editPreuveDocumentRepository.findAuditByLabellisationPreuve(
        preuveId
      );
    return canModifyCandidatureDocuments({
      audit,
      canMutateLabellisationDocuments:
        await this.canMutateLabellisationDocuments(user, collectiviteId),
    });
  }
}
