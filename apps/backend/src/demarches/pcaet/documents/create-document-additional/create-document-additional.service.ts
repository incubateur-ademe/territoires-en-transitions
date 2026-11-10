import { Injectable, Logger } from '@nestjs/common';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  DemarcheTypeEnum,
  isDemarcheDocumentsAdditionalAutorise,
  type DemarcheDocumentAdditional,
} from '@tet/domain/demarches';
import { DemarchePcaetAccessService } from '../../shared/demarche-pcaet-access.service';
import {
  CreateDemarchePcaetDocumentAdditionalError,
  CreateDemarchePcaetDocumentAdditionalErrorEnum,
} from './create-document-additional.errors';
import { CreateDemarchePcaetDocumentAdditionalInput } from './create-document-additional.input';
import {
  DemarchePcaetActeurEnum,
  DemarchePcaetEventEnum,
} from '../../shared/tracking/demarche-pcaet-tracking.constants';
import { DemarchePcaetTrackingService } from '../../shared/tracking/demarche-pcaet-tracking.service';

@Injectable()
export class CreateDemarchePcaetDocumentAdditionalService {
  private readonly logger = new Logger(
    CreateDemarchePcaetDocumentAdditionalService.name
  );

  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly accessService: DemarchePcaetAccessService,
    private readonly demarcheDocumentsRepository: DemarcheDocumentsRepository,
    private readonly trackingService: DemarchePcaetTrackingService
  ) {}

  /**
   * Ouvre une pièce hors catalogue sur le dossier : une ligne sans nom et sans
   * fichier, immédiatement prête à recevoir les deux.
   */
  async createDocumentAdditional(
    input: CreateDemarchePcaetDocumentAdditionalInput,
    { user, tx }: ServiceSecondArg
  ): Promise<
    Result<
      DemarcheDocumentAdditional,
      CreateDemarchePcaetDocumentAdditionalError
    >
  > {
    let onSuccess: (() => void) | undefined;
    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<
      Result<
        DemarcheDocumentAdditional,
        CreateDemarchePcaetDocumentAdditionalError
      >
    > => {
      // Les pièces additionnelles sont une autorisation du type de démarche, étape par
      // étape : un type qui ne l'ouvre pas ne l'ouvre pas non plus par l'API.
      const config = await this.demarcheDocumentsRepository.loadDocumentsConfig(
        DemarcheTypeEnum.PCAET,
        transaction
      );
      if (!isDemarcheDocumentsAdditionalAutorise(config, input.etape)) {
        return failure(
          CreateDemarchePcaetDocumentAdditionalErrorEnum.DOCUMENTS_ADDITIONAL_NON_AUTORISES
        );
      }

      const access = await this.accessService.assertWritable(
        input,
        input.etape,
        { user, tx: transaction }
      );
      if (!access.success) {
        return failure(
          CreateDemarchePcaetDocumentAdditionalErrorEnum[access.error]
        );
      }
      const demarche = access.data;

      const documentAdditional =
        await this.demarcheDocumentsRepository.insertDocumentAdditional(
          {
            collectiviteId: demarche.collectiviteId,
            demarcheId: demarche.id,
            etape: input.etape,
            commentaire: '',
            modifiedBy: user.id,
          },
          transaction
        );
      if (!documentAdditional) {
        return failure(
          CreateDemarchePcaetDocumentAdditionalErrorEnum.DATABASE_ERROR
        );
      }

      this.logger.log(
        `Free document ${documentAdditional.id} created on demarche PCAET ${demarche.id} (${input.etape}) by user ${user.id}`
      );
      onSuccess = () =>
        this.trackingService.track(
          DemarchePcaetEventEnum.DOCUMENT_ADDITIONNEL_AJOUTE,
          demarche,
          {
            userId: user.id,
            acteur: DemarchePcaetActeurEnum.COLLECTIVITE,
            properties: { etape: input.etape },
          }
        );
      return success(documentAdditional);
    };

    const result = await this.transactionManager.executeSingle(
      executeInTransaction,
      tx
    );
    if (result.success) {
      onSuccess?.();
    }
    return result;
  }
}
