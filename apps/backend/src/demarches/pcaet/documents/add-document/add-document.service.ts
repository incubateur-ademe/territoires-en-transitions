import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  DemarcheTypeEnum,
  getEtapeExigeanteDemarcheDocument,
  isDemarcheDocumentDeEtape,
  isDemarcheDocumentFileAccepted,
  listDefaultInclusions,
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
   *
   * Le dépôt coche au passage les pièces que le catalogue range d'office dans
   * celle-ci — un défaut, que la collectivité reste libre de décocher.
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
      // `input.collectiviteId` n'est pas encore vérifié ici : `assertWritable`
      // s'en charge juste après, et refuse une démarche qui ne lui appartient
      // pas. Le catalogue étant une donnée de référence en lecture ouverte,
      // rien n'en fuit entre-temps.
      const definition = await this.demarcheDocumentsRepository.findDefinition(
        DemarcheTypeEnum.PCAET,
        input.documentId,
        { collectiviteId: input.collectiviteId, demarcheId: input.demarcheId },
        transaction
      );
      if (!definition) {
        return failure(
          AddDemarchePcaetDocumentErrorEnum.DOCUMENT_DEFINITION_NOT_FOUND
        );
      }

      // Le temps visé, et non la portée de la pièce : une pièce de portée
      // `both` se dépose à l'amont pendant l'élaboration, et se reprend à l'aval
      // une fois l'instruction close.
      const etape =
        input.etape ?? getEtapeExigeanteDemarcheDocument(definition.etape);
      if (!isDemarcheDocumentDeEtape(definition.etape, etape)) {
        return failure(
          AddDemarchePcaetDocumentErrorEnum.DOCUMENT_DEFINITION_NOT_FOUND
        );
      }

      const access = await this.accessService.assertWritable(input, etape, {
        user,
        tx: transaction,
      });
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
          etape,
          fichierId: fichier.id,
          commentaire: input.commentaire ?? '',
          modifiedBy: user.id,
        },
        transaction
      );
      if (!document) {
        return failure(AddDemarchePcaetDocumentErrorEnum.DATABASE_ERROR);
      }

      const definitions =
        await this.demarcheDocumentsRepository.listDefinitions(
          DemarcheTypeEnum.PCAET,
          { collectiviteId: demarche.collectiviteId, demarcheId: demarche.id },
          transaction
        );
      const defaultInclusions = listDefaultInclusions(
        definitions,
        definition.id
      );
      await this.demarcheDocumentsRepository.declareDefaultInclusions(
        {
          collectiviteId: demarche.collectiviteId,
          demarcheId: demarche.id,
          documentIds: defaultInclusions,
          modifiedBy: user.id,
        },
        transaction
      );

      this.logger.log(
        `Document ${definition.id} deposited on demarche PCAET ${
          demarche.id
        } by user ${user.id}${
          defaultInclusions.length > 0
            ? `, default inclusions declared: ${defaultInclusions.join(', ')}`
            : ''
        }`
      );
      return success(document);
    };

    return this.transactionManager.executeSingle(executeInTransaction, tx);
  }
}
