import { BibliothequeFichierRepository } from '@tet/backend/collectivites/documents/bibliotheque-fichier.repository';
import { LabellisationDocumentsPermissionService } from '@tet/backend/collectivites/documents/labellisation-documents-permission.service';
import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
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
    private readonly addAuditDocumentRepository: AddAuditDocumentRepository,
    private readonly bibliothequeFichierRepository: BibliothequeFichierRepository,
    private readonly labellisationDocumentsPermissionService: LabellisationDocumentsPermissionService
  ) {}

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
      await this.labellisationDocumentsPermissionService.canMutate(
        { collectiviteId },
        { user, tx }
      );
    const canAddDocument = canAddAuditDocument({
      canMutateLabellisationDocuments,
      audit: { clos, valide },
    });
    if (!canAddDocument) {
      return failure(AddAuditDocumentErrorEnum.AUDIT_NOT_OPEN);
    }

    const isFichierOwnedByCollectivite =
      await this.bibliothequeFichierRepository.isFichierOwnedByCollectivite(
        { fichierId, collectiviteId },
        tx
      );
    if (!isFichierOwnedByCollectivite) {
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
