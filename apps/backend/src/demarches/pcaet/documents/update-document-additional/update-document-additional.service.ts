import { Injectable, Logger } from '@nestjs/common';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  DemarcheTypeEnum,
  isDemarcheDocumentFileAccepted,
  type DemarcheDocumentAdditional,
} from '@tet/domain/demarches';
import { DemarchePcaetAccessService } from '../../shared/demarche-pcaet-access.service';
import {
  UpdateDemarchePcaetDocumentAdditionalError,
  UpdateDemarchePcaetDocumentAdditionalErrorEnum,
} from './update-document-additional.errors';
import { UpdateDemarchePcaetDocumentAdditionalInput } from './update-document-additional.input';

@Injectable()
export class UpdateDemarchePcaetDocumentAdditionalService {
  private readonly logger = new Logger(
    UpdateDemarchePcaetDocumentAdditionalService.name
  );

  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly accessService: DemarchePcaetAccessService,
    private readonly demarcheDocumentsRepository: DemarcheDocumentsRepository
  ) {}

  /**
   * Renomme la pièce additionnelle et/ou y dépose un fichier. L'étape n'est pas dans
   * l'entrée : elle vient de la pièce en base, sinon on pourrait écrire dans une
   * partie gelée du dossier en annonçant l'autre.
   */
  async updateDocumentAdditional(
    input: UpdateDemarchePcaetDocumentAdditionalInput,
    { user, tx }: ServiceSecondArg
  ): Promise<
    Result<
      DemarcheDocumentAdditional,
      UpdateDemarchePcaetDocumentAdditionalError
    >
  > {
    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<
      Result<
        DemarcheDocumentAdditional,
        UpdateDemarchePcaetDocumentAdditionalError
      >
    > => {
      const existing =
        await this.demarcheDocumentsRepository.findDocumentAdditional(
          input,
          transaction
        );
      if (!existing) {
        return failure(
          UpdateDemarchePcaetDocumentAdditionalErrorEnum.DOCUMENT_ADDITIONAL_NOT_FOUND
        );
      }

      const access = await this.accessService.assertWritable(
        input,
        existing.etape,
        { user, tx: transaction }
      );
      if (!access.success) {
        return failure(
          UpdateDemarchePcaetDocumentAdditionalErrorEnum[access.error]
        );
      }
      const demarche = access.data;

      if (input.fichierId !== undefined) {
        // Le fichier est cherché dans la bibliothèque de la collectivité de la
        // démarche : celui d'une autre collectivité est simplement introuvable.
        const fichier =
          await this.demarcheDocumentsRepository.findFichierForCollectivite(
            input.fichierId,
            demarche.collectiviteId,
            transaction
          );
        if (!fichier) {
          return failure(
            UpdateDemarchePcaetDocumentAdditionalErrorEnum.FICHIER_NOT_FOUND
          );
        }

        // Une pièce additionnelle n'échappe pas aux formats du dossier : ce qui est
        // joint en pièce additionnelle l'est dans les mêmes formats que le reste.
        const config =
          await this.demarcheDocumentsRepository.loadDocumentsConfig(
            DemarcheTypeEnum.PCAET,
            transaction
          );
        if (!isDemarcheDocumentFileAccepted(fichier, config)) {
          return failure(
            UpdateDemarchePcaetDocumentAdditionalErrorEnum.FICHIER_FORMAT_NON_SUPPORTE
          );
        }
      }

      const documentAdditional =
        await this.demarcheDocumentsRepository.updateDocumentAdditional(
          {
            demarcheId: demarche.id,
            documentAdditionalId: input.documentAdditionalId,
            titre: input.titre,
            fichierId: input.fichierId,
            modifiedBy: user.id,
          },
          transaction
        );
      if (!documentAdditional) {
        return failure(
          UpdateDemarchePcaetDocumentAdditionalErrorEnum.DOCUMENT_ADDITIONAL_NOT_FOUND
        );
      }

      this.logger.log(
        `Free document ${input.documentAdditionalId} updated on demarche PCAET ${demarche.id} by user ${user.id}`
      );
      return success(documentAdditional);
    };

    return this.transactionManager.executeSingle(executeInTransaction, tx);
  }
}
