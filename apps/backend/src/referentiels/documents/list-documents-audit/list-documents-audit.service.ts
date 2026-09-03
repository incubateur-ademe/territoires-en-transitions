import { Injectable, Logger } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Result } from '@tet/backend/utils/result.type';
import {
  LegacyPreuveAuditWithFichier,
  preuveAuditWithFichierSchema,
} from '@tet/domain/collectivites';
import * as z from 'zod/mini';
import { GetLabellisationService } from '../../labellisations/get-labellisation.service';
import { ReferentielDocumentsAccessService } from '../referentiel-documents-access.service';
import {
  ListDocumentsAuditError,
  ListDocumentsAuditErrorEnum,
} from './list-documents-audit.errors';
import { ListDocumentsAuditInput } from './list-documents-audit.input';
import { ListDocumentsAuditRepository } from './list-documents-audit.repository';

@Injectable()
export class ListDocumentsAuditService {
  private readonly logger = new Logger(ListDocumentsAuditService.name);

  constructor(
    private readonly listDocumentsAuditRepository: ListDocumentsAuditRepository,
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
      }
      return {
        success: false,
        error: auditResult.error,
      };
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

    const documents = await this.listDocumentsAuditRepository.listDocumentsAudit(
      { auditId, canReadConfidentiel }
    );
    if (!documents.success) {
      return documents;
    }

    const parsed = z
      .array(preuveAuditWithFichierSchema)
      .safeParse(documents.data);
    if (!parsed.success) {
      this.logger.error(
        `Documents hors contrat pour l'audit ${auditId}: ${parsed.error.message}`
      );
      return {
        success: false,
        error: ListDocumentsAuditErrorEnum.DOCUMENT_SCHEMA_MISMATCH,
      };
    }

    return { success: true, data: parsed.data };
  }
}
