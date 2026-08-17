import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { DemarcheTypeEnum } from '@tet/domain/demarches';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
import { DemarchePcaetAccessService } from '../../shared/demarche-pcaet-access.service';
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
    private readonly transactionManager: TransactionManager,
    private readonly accessService: DemarchePcaetAccessService,
    private readonly demarcheDocumentsRepository: DemarcheDocumentsRepository
  ) {}

  /**
   * Retire la pièce déposée. Le fichier reste dans la bibliothèque de la
   * collectivité : seul le rattachement au dossier est supprimé.
   */
  async removeDocument(
    input: RemoveDemarchePcaetDocumentInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<{ documentId: string }, RemoveDemarchePcaetDocumentError>> {
    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<
      Result<{ documentId: string }, RemoveDemarchePcaetDocumentError>
    > => {
      // Une pièce hors modèle n'a par définition aucun dépôt à retirer.
      const definition = await this.demarcheDocumentsRepository.findDefinition(
        DemarcheTypeEnum.PCAET,
        input.documentId,
        transaction
      );
      if (!definition) {
        return failure(RemoveDemarchePcaetDocumentErrorEnum.DOCUMENT_NOT_FOUND);
      }

      // La partie du dossier concernée dépend de l'étape de la pièce : l'amont
      // se dépose pendant l'élaboration, l'aval une fois le PCAET adopté.
      const access = await this.accessService.assertWritable(
        input,
        definition.etape,
        { user, tx: transaction }
      );
      if (!access.success) {
        return failure(RemoveDemarchePcaetDocumentErrorEnum[access.error]);
      }
      const demarche = access.data;

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

    return this.transactionManager.executeSingle(executeInTransaction, tx);
  }
}
