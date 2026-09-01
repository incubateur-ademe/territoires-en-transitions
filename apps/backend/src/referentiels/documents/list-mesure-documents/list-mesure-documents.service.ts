import { Injectable, Logger } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { tryGetReferentielIdFromActionId } from '@tet/domain/referentiels';
import { ReferentielDocumentsAccessService } from '../referentiel-documents-access.service';
import { toAttendus } from './list-mesure-documents.adapter';
import {
  ListMesureDocumentsError,
  ListMesureDocumentsErrorEnum,
} from './list-mesure-documents.errors';
import { ListMesureDocumentsInput } from './list-mesure-documents.input';
import {
  ListMesureDocumentsOutput,
  listMesureDocumentsOutputSchema,
} from './list-mesure-documents.output';
import { ListMesureDocumentsRepository } from './list-mesure-documents.repository';

@Injectable()
export class ListMesureDocumentsService {
  private readonly logger = new Logger(ListMesureDocumentsService.name);

  constructor(
    private readonly listMesureDocumentsRepository: ListMesureDocumentsRepository,
    private readonly referentielDocumentsAccess: ReferentielDocumentsAccessService
  ) {}

  async listMesureDocuments(
    { collectiviteId, actionId, withSubActions }: ListMesureDocumentsInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<ListMesureDocumentsOutput, ListMesureDocumentsError>> {
    const referentielId = tryGetReferentielIdFromActionId(actionId);
    if (!referentielId) {
      return failure(ListMesureDocumentsErrorEnum.UNKNOWN_REFERENTIEL);
    }

    const accessResult =
      await this.referentielDocumentsAccess.checkUserCanReadDocuments(
        { collectiviteId, referentielId },
        { user, tx }
      );
    if (!accessResult.success) {
      return failure(ListMesureDocumentsErrorEnum.UNAUTHORIZED);
    }

    const { canReadConfidentiel } = accessResult.data;
    const scope = {
      collectiviteId,
      actionId,
      withSubActions,
      canReadConfidentiel,
    };

    const [attendusResult, complementairesResult] = await Promise.all([
      this.listMesureDocumentsRepository.listAttendus(scope, tx),
      this.listMesureDocumentsRepository.listComplementaires(scope, tx),
    ]);

    if (!attendusResult.success) {
      return failure(attendusResult.error);
    }
    if (!complementairesResult.success) {
      return failure(complementairesResult.error);
    }

    const parsing = listMesureDocumentsOutputSchema.safeParse({
      attendus: toAttendus(attendusResult.data),
      complementaires: complementairesResult.data,
    });

    if (!parsing.success) {
      this.logger.error(
        `Documents hors contrat pour la mesure ${actionId} de la collectivité ${collectiviteId}: ${parsing.error.message}`
      );
      return failure(ListMesureDocumentsErrorEnum.DOCUMENT_SCHEMA_MISMATCH);
    }

    return success(parsing.data);
  }
}
