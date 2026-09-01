import { Injectable, Logger } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ReferentielDocumentsAccessService } from '../referentiel-documents-access.service';
import {
  ListDocumentsError,
  ListDocumentsErrorEnum,
} from './list-documents.errors';
import { ListDocumentsInput } from './list-documents.input';
import {
  ListDocumentsOutput,
  listDocumentsOutputSchema,
} from './list-documents.output';
import { ListDocumentsRepository } from './list-documents.repository';

@Injectable()
export class ListDocumentsService {
  private readonly logger = new Logger(ListDocumentsService.name);

  constructor(
    private readonly listDocumentsRepository: ListDocumentsRepository,
    private readonly referentielDocumentsAccess: ReferentielDocumentsAccessService
  ) {}

  async listDocuments(
    { collectiviteId, referentielId }: ListDocumentsInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<ListDocumentsOutput, ListDocumentsError>> {
    const accessResult =
      await this.referentielDocumentsAccess.checkUserCanReadDocuments(
        { collectiviteId, referentielId },
        { user, tx }
      );
    if (!accessResult.success) {
      return failure(ListDocumentsErrorEnum.UNAUTHORIZED);
    }
    const { canReadConfidentiel } = accessResult.data;
    const scope = { collectiviteId, referentielId, canReadConfidentiel };

    const [labellisation, audit, rapport] = await Promise.all([
      this.listDocumentsRepository.listLabellisationDocuments(scope, tx),
      this.listDocumentsRepository.listAuditDocuments(scope, tx),
      this.listDocumentsRepository.listRapportDocuments(scope, tx),
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

    const documents = listDocumentsOutputSchema.safeParse({
      labellisation: labellisation.data,
      audit: audit.data,
      rapport: rapport.data,
    });

    if (!documents.success) {
      this.logger.error(
        `Documents hors contrat pour le référentiel ${referentielId} de la collectivité ${collectiviteId}: ${documents.error.message}`
      );
      return failure(ListDocumentsErrorEnum.DOCUMENT_SCHEMA_MISMATCH);
    }

    return success(documents.data);
  }
}
