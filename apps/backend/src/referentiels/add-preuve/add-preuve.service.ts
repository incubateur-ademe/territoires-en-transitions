import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { CommonError, CommonErrorEnum } from '@tet/backend/utils/trpc/common-errors';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import type {
    AddPreuveAuditInput,
    AddPreuveComplementaireInput,
    AddPreuveRapportInput,
    AddPreuveReglementaireInput,
} from './add-preuve.input';
import type { AddPreuveOutput } from './add-preuve.output';
import { AddPreuveRepository } from './add-preuve.repository';

@Injectable()
export class AddPreuveService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly addPreuveRepository: AddPreuveRepository
  ) {}

  async addPreuveReglementaire(
    input: AddPreuveReglementaireInput,
    user: AuthenticatedUser
  ): Promise<Result<AddPreuveOutput, CommonError>> {
    const actionId =
      await this.addPreuveRepository.getActionIdByPreuveReglementaireId(
        input.preuveId
      );

    if (!actionId) {
      return failure(CommonErrorEnum.NOT_FOUND);
    }

    const permissionResult = await this.assertReferentielWriteAllowed(
      input.collectiviteId,
      actionId,
      user
    );
    if (!permissionResult.success) {
      return permissionResult;
    }

    const commentaire = input.commentaire ?? '';

    if ('fichierId' in input) {
      const fichierCollectiviteId =
        await this.addPreuveRepository.getFichierCollectiviteId(input.fichierId);
      if (fichierCollectiviteId !== input.collectiviteId) {
        return failure(CommonErrorEnum.NOT_FOUND);
      }

      return this.addPreuveRepository.addPreuveReglementaireWithFile({
        ...input,
        commentaire,
        modifiedBy: user.id,
      });
    }

    return this.addPreuveRepository.addPreuveReglementaireWithLink({
      ...input,
      commentaire,
      modifiedBy: user.id,
    });
  }

  async addPreuveComplementaire(
    input: AddPreuveComplementaireInput,
    user: AuthenticatedUser
  ): Promise<Result<AddPreuveOutput, CommonError>> {
    const permissionResult = await this.assertReferentielWriteAllowed(
      input.collectiviteId,
      input.actionId,
      user
    );
    if (!permissionResult.success) {
      return permissionResult;
    }

    const commentaire = input.commentaire ?? '';

    if ('fichierId' in input) {
      const fichierCollectiviteId =
        await this.addPreuveRepository.getFichierCollectiviteId(input.fichierId);
      if (fichierCollectiviteId !== input.collectiviteId) {
        return failure(CommonErrorEnum.NOT_FOUND);
      }

      return this.addPreuveRepository.addPreuveComplementaireWithFile({
        ...input,
        commentaire,
        modifiedBy: user.id,
      });
    }

    return this.addPreuveRepository.addPreuveComplementaireWithLink({
      ...input,
      commentaire,
      modifiedBy: user.id,
    });
  }

  async addPreuveAudit(
    input: AddPreuveAuditInput,
    user: AuthenticatedUser
  ): Promise<Result<AddPreuveOutput, CommonError>> {
    const permissionResult = await this.assertDocumentsWriteAllowed(
      input.collectiviteId,
      user
    );
    if (!permissionResult.success) {
      return permissionResult;
    }

    const auditCollectiviteId =
      await this.addPreuveRepository.getAuditCollectiviteId(input.auditId);
    if (auditCollectiviteId !== input.collectiviteId) {
      return failure(CommonErrorEnum.NOT_FOUND);
    }

    const fichierCollectiviteId =
      await this.addPreuveRepository.getFichierCollectiviteId(input.fichierId);
    if (fichierCollectiviteId !== input.collectiviteId) {
      return failure(CommonErrorEnum.NOT_FOUND);
    }

    return this.addPreuveRepository.addPreuveAudit({
      ...input,
      commentaire: input.commentaire ?? '',
      modifiedBy: user.id,
    });
  }

  async addPreuveRapport(
    input: AddPreuveRapportInput,
    user: AuthenticatedUser
  ): Promise<Result<AddPreuveOutput, CommonError>> {
    const permissionResult = await this.assertDocumentsWriteAllowed(
      input.collectiviteId,
      user
    );
    if (!permissionResult.success) {
      return permissionResult;
    }

    const commentaire = input.commentaire ?? '';

    if ('fichierId' in input) {
      const fichierCollectiviteId =
        await this.addPreuveRepository.getFichierCollectiviteId(input.fichierId);
      if (fichierCollectiviteId !== input.collectiviteId) {
        return failure(CommonErrorEnum.NOT_FOUND);
      }

      return this.addPreuveRepository.addPreuveRapportWithFile({
        ...input,
        commentaire,
        modifiedBy: user.id,
      });
    }

    return this.addPreuveRepository.addPreuveRapportWithLink({
      ...input,
      commentaire,
      modifiedBy: user.id,
    });
  }

  /**
   * Preuves d'audit et rapports de visite : même droit que la modification et
   * la suppression des preuves (`edit-preuve-document`), porté par l'édition,
   * l'admin et l'auditeur (y compris pendant la fenêtre post-audit).
   */
  private async assertDocumentsWriteAllowed(
    collectiviteId: number,
    user: AuthenticatedUser
  ): Promise<Result<undefined, CommonError>> {
    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['COLLECTIVITES.DOCUMENTS.MUTATE'],
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );

    if (!permissionResult.success) {
      return failure(CommonErrorEnum.UNAUTHORIZED);
    }

    return success(undefined);
  }

  private async assertReferentielWriteAllowed(
    collectiviteId: number,
    actionId: string,
    user: AuthenticatedUser
  ): Promise<Result<undefined, CommonError>> {
    let referentielId;
    try {
      referentielId = getReferentielIdFromActionId(actionId);
    } catch {
      return failure(CommonErrorEnum.NOT_FOUND);
    }

    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.MUTATE'],
      ResourceType.REFERENTIEL,
      { collectiviteId, referentielId }
    );

    if (!permissionResult.success) {
      return failure(CommonErrorEnum.UNAUTHORIZED);
    }

    return success(undefined);
  }
}