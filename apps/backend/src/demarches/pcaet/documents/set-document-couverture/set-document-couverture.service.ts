import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  DemarcheTypeEnum,
  isDemarchePcaetDocumentsMutable,
} from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
import { DemarchePcaetRefRepository } from '../../shared/demarche-pcaet-ref.repository';
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
    private readonly databaseService: DatabaseService,
    private readonly demarchePcaetRefRepository: DemarchePcaetRefRepository,
    private readonly demarcheDocumentsRepository: DemarcheDocumentsRepository
  ) {}

  /**
   * Déclare une pièce attendue couverte sans document. Seules les pièces dont le
   * modèle prévoit une couverture par la plateforme sont éligibles, et seulement
   * si un plan d'actions est effectivement rattaché à la démarche.
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
      const demarche = await this.demarchePcaetRefRepository.findRef(
        input,
        { forUpdate: true },
        transaction
      );
      if (!demarche) {
        return failure(
          SetDemarchePcaetDocumentCouvertureErrorEnum.DEMARCHE_PCAET_NOT_FOUND
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
        return failure(
          SetDemarchePcaetDocumentCouvertureErrorEnum.UNAUTHORIZED
        );
      }

      if (!isDemarchePcaetDocumentsMutable(demarche.status)) {
        return failure(
          SetDemarchePcaetDocumentCouvertureErrorEnum.DEMARCHE_PCAET_NON_MODIFIABLE
        );
      }

      const definition =
        await this.demarcheDocumentsRepository.findDefinition(
          DemarcheTypeEnum.PCAET,
          input.documentId,
          transaction
        );
      if (!definition) {
        return failure(
          SetDemarchePcaetDocumentCouvertureErrorEnum.DOCUMENT_DEFINITION_NOT_FOUND
        );
      }

      const source = definition.couverturePlateforme;
      if (!source) {
        return failure(
          SetDemarchePcaetDocumentCouvertureErrorEnum.COUVERTURE_NON_APPLICABLE
        );
      }
      if (input.couvert && demarche.planActionId === null) {
        return failure(
          SetDemarchePcaetDocumentCouvertureErrorEnum.PLAN_ACTIONS_NON_RATTACHE
        );
      }

      await this.demarcheDocumentsRepository.setCouverture(
        {
          demarcheId: demarche.id,
          documentId: definition.id,
          source,
          couvert: input.couvert,
          createdBy: user.id,
        },
        transaction
      );

      this.logger.log(
        `Couverture ${source} ${
          input.couvert ? 'declared' : 'removed'
        } for document ${definition.id} on demarche PCAET ${
          demarche.id
        } by user ${user.id}`
      );
      return success({ documentId: definition.id, couvert: input.couvert });
    };

    return tx
      ? executeInTransaction(tx)
      : this.databaseService.db.transaction(executeInTransaction);
  }
}
