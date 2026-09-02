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
import { ReferentielDocumentsAccessService } from '../../documents/referentiel-documents-access.service';
import { GetLabellisationService } from '../get-labellisation.service';
import {
  ListPreuvesAuditError,
  ListPreuvesAuditErrorEnum,
} from './list-preuves-audit.errors';
import { ListPreuvesAuditInput } from './list-preuves-audit.input';
import {
  ListPreuvesLabellisationError,
  ListPreuvesLabellisationErrorEnum,
} from './list-preuves-labellisation.errors';
import { ListPreuvesLabellisationInput } from './list-preuves-labellisation.input';
import { ListPreuvesRepository } from './list-preuves.repository';

@Injectable()
export class ListPreuvesService {
  private readonly logger = new Logger(ListPreuvesService.name);

  constructor(
    private readonly listPreuvesRepository: ListPreuvesRepository,
    private readonly getLabellisationService: GetLabellisationService,
    private readonly referentielDocumentsAccess: ReferentielDocumentsAccessService
  ) {}

  async listPreuvesAudit(
    { auditId }: ListPreuvesAuditInput,
    user: AuthenticatedUser
  ): Promise<Result<LegacyPreuveAuditWithFichier[], ListPreuvesAuditError>> {
    const auditResult = await this.getLabellisationService.getAudit(auditId);
    if (!auditResult.success) {
      if (auditResult.error === 'NOT_FOUND') {
        return {
          success: false,
          error: ListPreuvesAuditErrorEnum.AUDIT_NOT_FOUND,
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

    const preuves = await this.listPreuvesRepository.listPreuvesAudit({
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
        error: ListPreuvesAuditErrorEnum.DOCUMENT_SCHEMA_MISMATCH,
      };
    }

    return { success: true, data: parsed.data };
  }

  async listPreuvesLabellisation(
    { demandeId }: ListPreuvesLabellisationInput,
    user: AuthenticatedUser
  ): Promise<
    Result<LegacyPreuveLabellisationWithFichier[], ListPreuvesLabellisationError>
  > {
    const demandeResult = await this.getLabellisationService.getDemande(
      demandeId
    );
    if (!demandeResult.success) {
      if (demandeResult.error === 'NOT_FOUND') {
        return {
          success: false,
          error: ListPreuvesLabellisationErrorEnum.DEMANDE_NOT_FOUND,
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

    const preuves = await this.listPreuvesRepository.listPreuvesLabellisation({
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
        error: ListPreuvesLabellisationErrorEnum.DOCUMENT_SCHEMA_MISMATCH,
      };
    }

    return { success: true, data: parsed.data };
  }
}
