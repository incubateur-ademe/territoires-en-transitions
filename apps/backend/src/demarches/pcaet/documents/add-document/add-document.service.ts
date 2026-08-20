import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  DemarcheTypeEnum,
  isDemarcheDocumentFileAccepted,
  type DemarcheDocumentDepose,
} from '@tet/domain/demarches';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
import { DemarchePcaetAccessService } from '../../shared/demarche-pcaet-access.service';
import {
  AddDemarchePcaetDocumentError,
  AddDemarchePcaetDocumentErrorEnum,
} from './add-document.errors';
import { AddDemarchePcaetDocumentInput } from './add-document.input';

@Injectable()
export class AddDemarchePcaetDocumentService {
  private readonly logger = new Logger(AddDemarchePcaetDocumentService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly transactionManager: TransactionManager,
    private readonly accessService: DemarchePcaetAccessService,
    private readonly demarcheDocumentsRepository: DemarcheDocumentsRepository
  ) {}

  /**
   * Rattache un fichier de la bibliothèque de la collectivité à une pièce
   * attendue du dossier. Une seule pièce par définition : un second dépôt
   * remplace le précédent.
   */
  async addDocument(
    input: AddDemarchePcaetDocumentInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarcheDocumentDepose, AddDemarchePcaetDocumentError>> {
    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<
      Result<DemarcheDocumentDepose, AddDemarchePcaetDocumentError>
    > => {
      const definition = await this.demarcheDocumentsRepository.findDefinition(
        DemarcheTypeEnum.PCAET,
        input.documentId,
        transaction
      );
      if (!definition) {
        return failure(
          AddDemarchePcaetDocumentErrorEnum.DOCUMENT_DEFINITION_NOT_FOUND
        );
      }

      // La partie du dossier concernée dépend de l'étape de la pièce : l'amont
      // se dépose pendant l'élaboration, l'aval une fois le PCAET adopté.
      const access = await this.accessService.assertWritable(
        input,
        definition.etape,
        { user, tx: transaction }
      );
      if (!access.success) {
        return failure(AddDemarchePcaetDocumentErrorEnum[access.error]);
      }
      const demarche = access.data;

      // Le fichier est cherché dans la bibliothèque de la collectivité de la
      // démarche : un fichier d'une autre collectivité est simplement
      // introuvable, sans révéler son existence.
      const fichier =
        await this.demarcheDocumentsRepository.findFichierForCollectivite(
          input.fichierId,
          demarche.collectiviteId,
          transaction
        );
      if (!fichier) {
        return failure(AddDemarchePcaetDocumentErrorEnum.FICHIER_NOT_FOUND);
      }

      // Les formats acceptés sont une propriété du type de démarche, pas une
      // règle du code : le dossier PCAET n'accepte que des PDF parce que sa
      // configuration le dit.
      const config = await this.demarcheDocumentsRepository.loadDocumentsConfig(
        DemarcheTypeEnum.PCAET,
        transaction
      );
      if (!isDemarcheDocumentFileAccepted(fichier, config)) {
        return failure(
          AddDemarchePcaetDocumentErrorEnum.FICHIER_FORMAT_NON_SUPPORTE
        );
      }

      const document = await this.demarcheDocumentsRepository.upsertDocument(
        {
          collectiviteId: demarche.collectiviteId,
          demarcheId: demarche.id,
          documentId: definition.id,
          fichierId: fichier.id,
          commentaire: input.commentaire ?? '',
          modifiedBy: user.id,
        },
        transaction
      );
      if (!document) {
        return failure(AddDemarchePcaetDocumentErrorEnum.DATABASE_ERROR);
      }

      this.logger.log(
        `Document ${definition.id} deposited on demarche PCAET ${demarche.id} by user ${user.id}`
      );
      return success(document);
    };

    return this.transactionManager.executeSingle(executeInTransaction, tx);
  }
}
