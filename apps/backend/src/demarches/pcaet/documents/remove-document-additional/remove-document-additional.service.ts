import { Injectable, Logger } from '@nestjs/common';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { DemarchePcaetAccessService } from '../../shared/demarche-pcaet-access.service';
import {
  RemoveDemarchePcaetDocumentAdditionalError,
  RemoveDemarchePcaetDocumentAdditionalErrorEnum,
} from './remove-document-additional.errors';
import { RemoveDemarchePcaetDocumentAdditionalInput } from './remove-document-additional.input';

@Injectable()
export class RemoveDemarchePcaetDocumentAdditionalService {
  private readonly logger = new Logger(
    RemoveDemarchePcaetDocumentAdditionalService.name
  );

  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly accessService: DemarchePcaetAccessService,
    private readonly demarcheDocumentsRepository: DemarcheDocumentsRepository
  ) {}

  /**
   * Retire une pièce additionnelle du dossier — la ligne entière, titre compris :
   * elle n'existe que par la volonté de la collectivité. Le fichier, lui, reste dans
   * la bibliothèque.
   */
  async removeDocumentAdditional(
    input: RemoveDemarchePcaetDocumentAdditionalInput,
    { user, tx }: ServiceSecondArg
  ): Promise<
    Result<
      { documentAdditionalId: number },
      RemoveDemarchePcaetDocumentAdditionalError
    >
  > {
    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<
      Result<
        { documentAdditionalId: number },
        RemoveDemarchePcaetDocumentAdditionalError
      >
    > => {
      const existing =
        await this.demarcheDocumentsRepository.findDocumentAdditional(
          input,
          transaction
        );
      if (!existing) {
        return failure(
          RemoveDemarchePcaetDocumentAdditionalErrorEnum.DOCUMENT_ADDITIONAL_NOT_FOUND
        );
      }

      const access = await this.accessService.assertWritable(
        input,
        existing.etape,
        { user, tx: transaction }
      );
      if (!access.success) {
        return failure(
          RemoveDemarchePcaetDocumentAdditionalErrorEnum[access.error]
        );
      }
      const demarche = access.data;

      const deleted =
        await this.demarcheDocumentsRepository.deleteDocumentAdditional(
          {
            demarcheId: demarche.id,
            documentAdditionalId: input.documentAdditionalId,
          },
          transaction
        );
      if (!deleted) {
        return failure(
          RemoveDemarchePcaetDocumentAdditionalErrorEnum.DOCUMENT_ADDITIONAL_NOT_FOUND
        );
      }

      this.logger.log(
        `Free document ${input.documentAdditionalId} removed from demarche PCAET ${demarche.id} by user ${user.id}`
      );
      return success({ documentAdditionalId: input.documentAdditionalId });
    };

    return this.transactionManager.executeSingle(executeInTransaction, tx);
  }
}
