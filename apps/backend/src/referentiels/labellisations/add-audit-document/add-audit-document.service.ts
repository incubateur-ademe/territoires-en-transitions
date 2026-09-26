import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result } from '@tet/backend/utils/result.type';
import { CommonErrorEnum } from '@tet/backend/utils/trpc/common-errors';
import { PreuveAudit } from '@tet/domain/collectivites';
import { canAddAuditDocument } from '@tet/domain/referentiels';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { GetLabellisationService } from '../get-labellisation.service';
import {
  AddAuditDocumentError,
  AddAuditDocumentErrorEnum,
} from './add-audit-document.errors';
import { AddAuditDocumentInput } from './add-audit-document.input';
import { AddAuditDocumentRepository } from './add-audit-document.repository';

@Injectable()
export class AddAuditDocumentService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly getLabellisationService: GetLabellisationService,
    private readonly addAuditDocumentRepository: AddAuditDocumentRepository
  ) {}

  private async canMutateLabellisationDocuments(
    user: AuthenticatedUser,
    collectiviteId: number,
    tx?: Transaction
  ): Promise<boolean> {
    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.LABELLISATIONS.MUTATE_DOCUMENTS'],
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );
    return permissionResult.success;
  }

  async addAuditDocument(
    input: AddAuditDocumentInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<PreuveAudit, AddAuditDocumentError>> {
    const { auditId, fichierId } = input;

    const auditResult = await this.getLabellisationService.getAudit(
      auditId,
      tx
    );
    if (!auditResult.success) {
      const auditError =
        auditResult.error === CommonErrorEnum.NOT_FOUND
          ? AddAuditDocumentErrorEnum.AUDIT_NOT_FOUND
          : AddAuditDocumentErrorEnum.DATABASE_ERROR;
      return failure(auditError);
    }

    const { collectiviteId, referentielId, clos, valide } = auditResult.data;

    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.MUTATE'],
      ResourceType.REFERENTIEL,
      { collectiviteId, referentielId },
      tx
    );
    if (!permissionResult.success) {
      return failure(permissionResult.error);
    }

    const canMutateLabellisationDocuments =
      await this.canMutateLabellisationDocuments(user, collectiviteId, tx);
    const canAddDocument = canAddAuditDocument({
      canMutateLabellisationDocuments,
      audit: { clos, valide },
    });
    if (!canAddDocument) {
      return failure(AddAuditDocumentErrorEnum.AUDIT_NOT_OPEN);
    }

    const fichierResult =
      await this.addAuditDocumentRepository.getFichierCollectiviteId(
        fichierId,
        tx
      );
    if (!fichierResult.success) {
      return failure(fichierResult.error);
    }

    const fichierCollectiviteId = fichierResult.data;
    if (fichierCollectiviteId !== collectiviteId) {
      return failure(AddAuditDocumentErrorEnum.FICHIER_NOT_FOUND);
    }

    return this.addAuditDocumentRepository.addAuditDocument(
      {
        auditId,
        fichierId,
        collectiviteId,
        modifiedBy: user.id,
      },
      tx
    );
  }
}
