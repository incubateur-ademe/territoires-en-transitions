import { Injectable, Logger } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Result } from '@tet/backend/utils/result.type';
import {
  LegacyPreuveAuditWithFichier,
  LegacyPreuveLabellisationWithFichier,
  preuveAuditWithFichierSchema,
  preuveLabellisationWithFichierSchema,
} from '@tet/domain/collectivites';
import * as z from 'zod/mini';
import { ReferentielDocumentsAccessService } from '../referentiel-documents-access.service';
import { GetLabellisationService } from '../../labellisations/get-labellisation.service';
import {
  ListDocumentsAuditError,
  ListDocumentsAuditErrorEnum,
} from './list-documents-audit.errors';
import { ListDocumentsAuditInput } from './list-documents-audit.input';
import {
  ListDocumentsDemandeLabellisationError,
  ListDocumentsDemandeLabellisationErrorEnum,
} from './list-documents-demande-labellisation.errors';
import { ListDocumentsDemandeLabellisationInput } from './list-documents-demande-labellisation.input';
import { ListDocumentsLabellisationRepository } from './list-documents-labellisation.repository';

@Injectable()
export class ListDocumentsLabellisationService {
  private readonly logger = new Logger(ListDocumentsLabellisationService.name);

  constructor(
    private readonly listDocumentsLabellisationRepository: ListDocumentsLabellisationRepository,
    private readonly getLabellisationService: GetLabellisationService,
    private readonly referentielDocumentsAccess: ReferentielDocumentsAccessService
  ) {}

  async listDocumentsAudit(
    { auditId }: ListDocumentsAuditInput,
    user: AuthenticatedUser
  ): Promise<Result<LegacyPreuveAuditWithFichier[], ListDocumentsAuditError>> {
    const auditResult = await this.getLabellisationService.getAudit(auditId);
    if (!auditResult.success) {
      if (auditResult.error === 'NOT_FOUND') {
        return {
          success: false,
          error: ListDocumentsAuditErrorEnum.AUDIT_NOT_FOUND,
        };
      } else {
        return {
          success: false,
          error: auditResult.error,
        };
      }
    }
    const auditData = auditResult.data;
    const accessResult =
      await this.referentielDocumentsAccess.checkUserCanReadDocuments(
        {
          collectiviteId: auditData.collectiviteId,
          referentielId: auditData.referentielId,
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

    const preuves = await this.listDocumentsLabellisationRepository.listDocumentsAudit({
      auditId,
      canReadConfidentiel,
    });
    if (!preuves.success) {
      return preuves;
    }

    const parsed = z.array(preuveAuditWithFichierSchema).safeParse(preuves.data);
    if (!parsed.success) {
      this.logger.error(
        `Preuves hors contrat pour l'audit ${auditId}: ${parsed.error.message}`
      );
      return {
        success: false,
        error: ListDocumentsAuditErrorEnum.DOCUMENT_SCHEMA_MISMATCH,
      };
    }

    return { success: true, data: parsed.data };
  }

  async listDocumentsDemandeLabellisation(
    { demandeId }: ListDocumentsDemandeLabellisationInput,
    user: AuthenticatedUser
  ): Promise<
    Result<LegacyPreuveLabellisationWithFichier[], ListDocumentsDemandeLabellisationError>
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
      } else {
        return {
          success: false,
          error: demandeResult.error,
        };
      }
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

    const preuves = await this.listDocumentsLabellisationRepository.listDocumentsDemandeLabellisation({
      demandeId,
      canReadConfidentiel,
    });
    if (!preuves.success) {
      return preuves;
    }

    const parsed = z
      .array(preuveLabellisationWithFichierSchema)
      .safeParse(preuves.data);
    if (!parsed.success) {
      this.logger.error(
        `Preuves hors contrat pour la demande ${demandeId}: ${parsed.error.message}`
      );
      return {
        success: false,
        error: ListDocumentsDemandeLabellisationErrorEnum.DOCUMENT_SCHEMA_MISMATCH,
      };
    }

    return { success: true, data: parsed.data };
  }
}
