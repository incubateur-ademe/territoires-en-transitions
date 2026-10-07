import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  DemarcheTypeEnum,
  isDemarcheDocumentInclusionDeclarable,
} from '@tet/domain/demarches';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
import { DemarchePcaetAccessService } from '../../shared/demarche-pcaet-access.service';
import {
  SetDemarchePcaetDocumentCouvertureError,
  SetDemarchePcaetDocumentCouvertureErrorEnum,
} from './set-document-couverture.errors';
import { SetDemarchePcaetDocumentCouvertureInput } from './set-document-couverture.input';

type SetCouvertureResult = { documentId: string; couvert: boolean };

@Injectable()
export class SetDemarchePcaetDocumentCouvertureService {
  private readonly logger = new Logger(
    SetDemarchePcaetDocumentCouvertureService.name
  );

  constructor(
    private readonly permissionService: PermissionService,
    private readonly transactionManager: TransactionManager,
    private readonly accessService: DemarchePcaetAccessService,
    private readonly demarcheDocumentsRepository: DemarcheDocumentsRepository
  ) {}

  /**
   * Déclare une pièce attendue comprise dans une autre pièce du dossier. Le
   * modèle en décide : une pièce à qui il n'ouvre aucune inclusion n'est pas
   * déclarable.
   *
   * Le dépôt du document qui accueille l'inclusion n'est pas exigé ici : la
   * déclaration dit l'intention, et c'est la règle de couverture qui décide si
   * elle vaut — le guard `dossierComplet` de la transmission le vérifie, une
   * bonne fois.
   */
  async setCouverture(
    input: SetDemarchePcaetDocumentCouvertureInput,
    { user, tx }: ServiceSecondArg
  ): Promise<
    Result<SetCouvertureResult, SetDemarchePcaetDocumentCouvertureError>
  > {
    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<
      Result<SetCouvertureResult, SetDemarchePcaetDocumentCouvertureError>
    > => {
      const definition = await this.demarcheDocumentsRepository.findDefinition(
        DemarcheTypeEnum.PCAET,
        input.documentId,
        { collectiviteId: input.collectiviteId, demarcheId: input.demarcheId },
        transaction
      );
      if (!definition) {
        return failure(
          SetDemarchePcaetDocumentCouvertureErrorEnum.DOCUMENT_DEFINITION_NOT_FOUND
        );
      }

      // La partie du dossier concernée dépend de l'étape de la pièce : l'amont
      // se dépose pendant l'élaboration, l'aval une fois le PCAET adopté.
      const access = await this.accessService.assertWritable(
        input,
        // Déclarer une inclusion parle du dossier transmis : c'est l'amont qui
        // décide si l'écriture est encore permise, quelle que soit la portée.
        'amont',
        { user, tx: transaction }
      );
      if (!access.success) {
        return failure(
          SetDemarchePcaetDocumentCouvertureErrorEnum[access.error]
        );
      }
      const demarche = access.data;

      if (!isDemarcheDocumentInclusionDeclarable(definition)) {
        return failure(
          SetDemarchePcaetDocumentCouvertureErrorEnum.COUVERTURE_NON_APPLICABLE
        );
      }
      const written = await this.demarcheDocumentsRepository.setCouverture(
        {
          collectiviteId: demarche.collectiviteId,
          demarcheId: demarche.id,
          documentId: definition.id,
          couvert: input.couvert,
          modifiedBy: user.id,
        },
        transaction
      );
      // Un dépôt occupe déjà la place de la pièce : refuser plutôt que de
      // renvoyer un succès sans rien avoir enregistré.
      if (!written) {
        return failure(
          SetDemarchePcaetDocumentCouvertureErrorEnum.COUVERTURE_CONFLIT_DEPOT
        );
      }

      this.logger.log(
        `Inclusion ${input.couvert ? 'declared' : 'removed'} for document ${
          definition.id
        } on demarche PCAET ${demarche.id} by user ${user.id}`
      );
      return success({ documentId: definition.id, couvert: input.couvert });
    };

    return this.transactionManager.executeSingle(executeInTransaction, tx);
  }
}
