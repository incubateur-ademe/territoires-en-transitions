import { Injectable, Logger } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ReferentielDocumentsAccessService } from '../referentiel-documents-access.service';
import {
  ListDocumentsReferentielError,
  ListDocumentsReferentielErrorEnum,
} from './list-documents-referentiel.errors';
import { ListDocumentsReferentielInput } from './list-documents-referentiel.input';
import {
  ListDocumentsReferentielOutput,
  listDocumentsReferentielOutputSchema,
} from './list-documents-referentiel.output';
import { ListDocumentsReferentielRepository } from './list-documents-referentiel.repository';

@Injectable()
export class ListDocumentsReferentielService {
  private readonly logger = new Logger(ListDocumentsReferentielService.name);

  constructor(
    private readonly listDocumentsReferentielRepository: ListDocumentsReferentielRepository,
    private readonly referentielDocumentsAccess: ReferentielDocumentsAccessService
  ) {}

  async listDocumentsReferentiel(
    { collectiviteId, referentielId }: ListDocumentsReferentielInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<ListDocumentsReferentielOutput, ListDocumentsReferentielError>> {
    const accessResult =
      await this.referentielDocumentsAccess.checkUserCanReadDocuments(
        { collectiviteId, referentielId },
        { user, tx }
      );
    if (!accessResult.success) {
      return failure(ListDocumentsReferentielErrorEnum.UNAUTHORIZED);
    }
    const { canReadConfidentiel } = accessResult.data;
    const scope = { collectiviteId, referentielId, canReadConfidentiel };

    const [labellisation, audit, rapport] = await Promise.all([
      this.listDocumentsReferentielRepository.listLabellisationDocuments(scope, tx),
      this.listDocumentsReferentielRepository.listAuditDocuments(scope, tx),
      this.listDocumentsReferentielRepository.listRapportDocuments(scope, tx),
    ]);

    if (!labellisation.success) {
      return failure(labellisation.error);
    }
    if (!audit.success) {
      return failure(audit.error);
    }
    if (!rapport.success) {
      return failure(rapport.error);
    }

    const documents = listDocumentsReferentielOutputSchema.safeParse({
      labellisation: labellisation.data,
      audit: audit.data,
      rapport: rapport.data,
    });

    if (!documents.success) {
      this.logger.error(
        `Documents hors contrat pour le référentiel ${referentielId} de la collectivité ${collectiviteId}: ${documents.error.message}`
      );
      return failure(ListDocumentsReferentielErrorEnum.DOCUMENT_SCHEMA_MISMATCH);
    }

    return success(documents.data);
  }
}
