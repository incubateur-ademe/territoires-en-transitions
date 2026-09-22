import { Injectable, Logger } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Result } from '@tet/backend/utils/result.type';
import { toDocuments } from '@tet/backend/collectivites/documents/to-documents.adapter';
import { GetLabellisationService } from '../../labellisations/get-labellisation.service';
import { ReferentielDocumentsAccessService } from '../referentiel-documents-access.service';
import {
  ListDocumentsDemandeLabellisationError,
  ListDocumentsDemandeLabellisationErrorEnum,
} from './list-documents-demande-labellisation.errors';
import { ListDocumentsDemandeLabellisationInput } from './list-documents-demande-labellisation.input';
import {
  DocumentDemandeLabellisation,
  listDocumentsDemandeLabellisationOutputSchema,
} from './list-documents-demande-labellisation.output';
import { ListDocumentsDemandeLabellisationRepository } from './list-documents-demande-labellisation.repository';

@Injectable()
export class ListDocumentsDemandeLabellisationService {
  private readonly logger = new Logger(
    ListDocumentsDemandeLabellisationService.name
  );

  constructor(
    private readonly listDocumentsDemandeLabellisationRepository: ListDocumentsDemandeLabellisationRepository,
    private readonly getLabellisationService: GetLabellisationService,
    private readonly referentielDocumentsAccess: ReferentielDocumentsAccessService
  ) {}

  async listDocumentsDemandeLabellisation(
    { demandeId }: ListDocumentsDemandeLabellisationInput,
    user: AuthenticatedUser
  ): Promise<
    Result<
      DocumentDemandeLabellisation[],
      ListDocumentsDemandeLabellisationError
    >
  > {
    const demandeResult = await this.getLabellisationService.getDemande(
      demandeId
    );
    if (!demandeResult.success) {
      if (demandeResult.error === 'NOT_FOUND') {
        return {
          success: false,
          error: ListDocumentsDemandeLabellisationErrorEnum.DEMANDE_NOT_FOUND,
        };
      }
      return {
        success: false,
        error: demandeResult.error,
      };
    }
    const demande = demandeResult.data;

    const accessResult =
      await this.referentielDocumentsAccess.checkUserCanReadDocuments(
        {
          collectiviteId: demande.collectiviteId,
          referentielId: demande.referentiel,
        },
        { user }
      );
    if (!accessResult.success) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
      };
    }

    const { canReadConfidentiel } = accessResult.data;

    const documents =
      await this.listDocumentsDemandeLabellisationRepository.listDocumentsDemandeLabellisation(
        {
          collectiviteId: demande.collectiviteId,
          demandeId,
          canReadConfidentiel,
        }
      );
    if (!documents.success) {
      return documents;
    }

    const assembled = toDocuments(documents.data);
    const droppedCount = documents.data.length - assembled.length;
    if (droppedCount > 0) {
      this.logger.warn(
        `Dropped ${droppedCount} document(s) of demande ${demandeId}: no usable file nor link`
      );
    }

    const parsed =
      listDocumentsDemandeLabellisationOutputSchema.safeParse(assembled);
    if (!parsed.success) {
      this.logger.error(
        `Documents out of contract for demande ${demandeId}: ${parsed.error.issues
          .map((issue) => issue.path.join('.'))
          .join(', ')}`
      );
      return {
        success: false,
        error:
          ListDocumentsDemandeLabellisationErrorEnum.DOCUMENT_SCHEMA_MISMATCH,
      };
    }

    return { success: true, data: parsed.data };
  }
}
