import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { isDemarchePcaetDocumentsMutable } from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
import { DemarchePcaetRefRepository } from '../../shared/demarche-pcaet-ref.repository';
import {
  RemoveDemarchePcaetDocumentError,
  RemoveDemarchePcaetDocumentErrorEnum,
} from './remove-document.errors';
import { RemoveDemarchePcaetDocumentInput } from './remove-document.input';

@Injectable()
export class RemoveDemarchePcaetDocumentService {
  private readonly logger = new Logger(RemoveDemarchePcaetDocumentService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly databaseService: DatabaseService,
    private readonly demarchePcaetRefRepository: DemarchePcaetRefRepository,
    private readonly demarcheDocumentsRepository: DemarcheDocumentsRepository
  ) {}

  /**
   * Retire la pièce déposée. Le fichier reste dans la bibliothèque de la
   * collectivité : seul le rattachement au dossier est supprimé.
   */
  async removeDocument(
    input: RemoveDemarchePcaetDocumentInput,
    { user, tx }: ServiceSecondArg
  ): Promise<
    Result<{ documentId: string }, RemoveDemarchePcaetDocumentError>
  > {
    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<
      Result<{ documentId: string }, RemoveDemarchePcaetDocumentError>
    > => {
      const demarche = await this.demarchePcaetRefRepository.findRef(
        input,
        { forUpdate: true },
        transaction
      );
      if (!demarche) {
        return failure(
          RemoveDemarchePcaetDocumentErrorEnum.DEMARCHE_PCAET_NOT_FOUND
        );
      }

      const permissionResult = await this.permissionService.isAllowed(
        user,
        PermissionOperationEnum['DEMARCHES.PCAET.MUTATE'],
        ResourceType.COLLECTIVITE,
        { collectiviteId: demarche.collectiviteId },
        transaction
      );
      if (!permissionResult.success) {
        return failure(RemoveDemarchePcaetDocumentErrorEnum.UNAUTHORIZED);
      }

      if (!isDemarchePcaetDocumentsMutable(demarche.status)) {
        return failure(
          RemoveDemarchePcaetDocumentErrorEnum.DEMARCHE_PCAET_NON_MODIFIABLE
        );
      }

      const deleted = await this.demarcheDocumentsRepository.deleteDocument(
        { demarcheId: demarche.id, documentId: input.documentId },
        transaction
      );
      if (!deleted) {
        return failure(RemoveDemarchePcaetDocumentErrorEnum.DOCUMENT_NOT_FOUND);
      }

      this.logger.log(
        `Document ${input.documentId} removed from demarche PCAET ${demarche.id} by user ${user.id}`
      );
      return success({ documentId: input.documentId });
    };

    return tx
      ? executeInTransaction(tx)
      : this.databaseService.db.transaction(executeInTransaction);
  }
}
