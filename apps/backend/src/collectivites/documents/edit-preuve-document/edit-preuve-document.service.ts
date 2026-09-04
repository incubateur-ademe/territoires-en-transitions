import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, Result } from '@tet/backend/utils/result.type';
import { CommonErrorEnum } from '@tet/backend/utils/trpc/common-errors';
import { PreuveBase, PreuveType } from '@tet/domain/collectivites';
import {
  CandidatureDocumentsUpdate,
  canUpdateCandidatureDocuments,
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
      const preuveUpdate = await this.canUpdatePreuve({
        preuveType,
        preuveId,
        collectiviteId: preuve.collectiviteId,
        user,
      });
      if (!preuveUpdate.canUpdate) {
        return failure(this.toEditPreuveError(preuveUpdate));
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

    const preuveRemoval = await this.canUpdatePreuve({
      preuveType,
      preuveId,
      collectiviteId: preuve.collectiviteId,
      user,
    });
    if (!preuveRemoval.canUpdate) {
      return failure(this.toEditPreuveError(preuveRemoval));
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

  private async canUpdatePreuve({
    preuveType,
    preuveId,
    collectiviteId,
    user,
  }: {
    preuveType: PreuveType;
    preuveId: number;
    collectiviteId: number;
    user: AuthenticatedUser;
  }): Promise<CandidatureDocumentsUpdate> {
    if (preuveType !== 'labellisation') {
      return { canUpdate: true };
    }
    const canMutateLabellisationDocuments =
      await this.canMutateLabellisationDocuments(user, collectiviteId);
    if (canMutateLabellisationDocuments) {
      return { canUpdate: true };
    }
    const referentielId =
      await this.editPreuveDocumentRepository.findReferentielByLabellisationPreuve(
        preuveId
      );
    const canMutateReferentiels =
      referentielId !== null &&
      (
        await this.permissionService.isAllowed(
          user,
          PermissionOperationEnum['REFERENTIELS.MUTATE'],
          ResourceType.REFERENTIEL,
          { collectiviteId, referentielId }
        )
      ).success;
    const isAuditeur =
      await this.editPreuveDocumentRepository.isAuditeurForLabellisationPreuve(
        preuveId,
        user.id
      );
    const audit =
      await this.editPreuveDocumentRepository.findAuditByLabellisationPreuve(
        preuveId
      );
    return canUpdateCandidatureDocuments({
      isAuditee: !isAuditeur && canMutateReferentiels,
      canMutateLabellisationDocuments,
      audit,
    });
  }

  private toEditPreuveError({
    reason,
  }: {
    reason: 'not_auditee' | 'frozen';
  }): EditPreuveDocumentError {
    return reason === 'not_auditee'
      ? CommonErrorEnum.UNAUTHORIZED
      : EditPreuveDocumentErrorEnum.LABELLISATION_IN_PROGRESS;
  }
}
