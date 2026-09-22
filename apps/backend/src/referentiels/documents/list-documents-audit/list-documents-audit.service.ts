import { Injectable, Logger } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Result } from '@tet/backend/utils/result.type';
import { toDocuments } from '@tet/backend/collectivites/documents/to-documents.adapter';
import { GetLabellisationService } from '../../labellisations/get-labellisation.service';
import { ReferentielDocumentsAccessService } from '../referentiel-documents-access.service';
import {
  ListDocumentsAuditError,
  ListDocumentsAuditErrorEnum,
} from './list-documents-audit.errors';
import { ListDocumentsAuditInput } from './list-documents-audit.input';
import {
  DocumentAudit,
  listDocumentsAuditOutputSchema,
} from './list-documents-audit.output';
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
  ): Promise<Result<DocumentAudit[], ListDocumentsAuditError>> {
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

    const documents =
      await this.listDocumentsAuditRepository.listDocumentsAudit({
        collectiviteId: auditData.collectiviteId,
        auditId,
        canReadConfidentiel,
      });
    if (!documents.success) {
      return documents;
    }

    const assembled = toDocuments(documents.data);
    const droppedCount = documents.data.length - assembled.length;
    if (droppedCount > 0) {
      this.logger.warn(
        `Dropped ${droppedCount} document(s) of audit ${auditId}: no usable file nor link`
      );
    }

    const parsed = listDocumentsAuditOutputSchema.safeParse(assembled);
    if (!parsed.success) {
      this.logger.error(
        `Documents out of contract for audit ${auditId}: ${parsed.error.issues
          .map((issue) => issue.path.join('.'))
          .join(', ')}`
      );
      return {
        success: false,
        error: ListDocumentsAuditErrorEnum.DOCUMENT_SCHEMA_MISMATCH,
      };
    }

    return { success: true, data: parsed.data };
  }
}
