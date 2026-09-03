import { Injectable, Logger } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { tryGetReferentielIdFromActionId } from '@tet/domain/referentiels';
import { ReferentielDocumentsAccessService } from '../referentiel-documents-access.service';
import { toAttendus } from './list-documents-mesure.adapter';
import {
  ListDocumentsMesureError,
  ListDocumentsMesureErrorEnum,
} from './list-documents-mesure.errors';
import { ListDocumentsMesureInput } from './list-documents-mesure.input';
import {
  ListDocumentsMesureOutput,
  listDocumentsMesureOutputSchema,
} from './list-documents-mesure.output';
import { ListDocumentsMesureRepository } from './list-documents-mesure.repository';

@Injectable()
export class ListDocumentsMesureService {
  private readonly logger = new Logger(ListDocumentsMesureService.name);

  constructor(
    private readonly listDocumentsMesureRepository: ListDocumentsMesureRepository,
    private readonly referentielDocumentsAccess: ReferentielDocumentsAccessService
  ) {}

  async listDocumentsMesure(
    { collectiviteId, actionId, withSubActions }: ListDocumentsMesureInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<ListDocumentsMesureOutput, ListDocumentsMesureError>> {
    const referentielId = tryGetReferentielIdFromActionId(actionId);
    if (!referentielId) {
      return failure(ListDocumentsMesureErrorEnum.UNKNOWN_REFERENTIEL);
    }

    const accessResult =
      await this.referentielDocumentsAccess.checkUserCanReadDocuments(
        { collectiviteId, referentielId },
        { user, tx }
      );
    if (!accessResult.success) {
      return failure(ListDocumentsMesureErrorEnum.UNAUTHORIZED);
    }

    const { canReadConfidentiel } = accessResult.data;
    const scope = {
      collectiviteId,
      actionId,
      withSubActions,
      canReadConfidentiel,
    };

    const [attendusResult, complementairesResult] = await Promise.all([
      this.listDocumentsMesureRepository.listAttendus(scope, tx),
      this.listDocumentsMesureRepository.listComplementaires(scope, tx),
    ]);

    if (!attendusResult.success) {
      return failure(attendusResult.error);
    }
    if (!complementairesResult.success) {
      return failure(complementairesResult.error);
    }

    const parsing = listDocumentsMesureOutputSchema.safeParse({
      attendus: toAttendus(attendusResult.data),
      complementaires: complementairesResult.data,
    });

    if (!parsing.success) {
      this.logger.error(
        `Documents hors contrat pour la mesure ${actionId} de la collectivité ${collectiviteId}: ${parsing.error.message}`
      );
      return failure(ListDocumentsMesureErrorEnum.DOCUMENT_SCHEMA_MISMATCH);
    }

    return success(parsing.data);
  }
}
