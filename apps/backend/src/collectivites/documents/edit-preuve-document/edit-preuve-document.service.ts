import { Injectable } from '@nestjs/common';
import { ReferentielModeGuard } from '@tet/backend/collectivites/collectivite-referentiel-mode/referentiel-mode-guard.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, Result } from '@tet/backend/utils/result.type';
import { CommonErrorEnum } from '@tet/backend/utils/trpc/common-errors';
import { PreuveBase, PreuveType } from '@tet/domain/collectivites';
import { canModifyCandidatureDocuments } from '@tet/domain/referentiels';
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
    private readonly editPreuveDocumentRepository: EditPreuveDocumentRepository,
    private readonly referentielModeGuard: ReferentielModeGuard
  ) {}

  private async assertComplementairePreuveWritable(
    preuveType: PreuveType,
    preuveId: number,
    collectiviteId: number
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
    const modeResult =
      await this.referentielModeGuard.assertCanMutateActionOrFailure(
        collectiviteId,
        actionId
      );
    if (!modeResult.success) {
      return modeResult.error;
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

    const modeError = await this.assertComplementairePreuveWritable(
      preuveType,
      preuveId,
      preuve.collectiviteId
    );
    if (modeError) {
      return failure(modeError);
    }

    if (!(await this.canModifyPreuve(preuveType, preuveId))) {
      return failure('LABELLISATION_IN_PROGRESS');
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
  ): Promise<Result<{ id: number }, EditPreuveDocumentError>> {
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

    const modeError = await this.assertComplementairePreuveWritable(
      preuveType,
      preuveId,
      preuve.collectiviteId
    );
    if (modeError) {
      return failure(modeError);
    }

    if (!(await this.canModifyPreuve(preuveType, preuveId))) {
      return failure('LABELLISATION_IN_PROGRESS');
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
