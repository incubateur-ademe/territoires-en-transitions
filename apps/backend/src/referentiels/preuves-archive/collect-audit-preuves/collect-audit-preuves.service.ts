import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { ReferentielId } from '@tet/domain/referentiels';
import { ResourceType } from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import {
  PreuvesArchiveErrorEnum,
  type PreuvesArchiveError,
} from '../preuves-archive.errors';
import {
  CollectPreuvesRepository,
  type CollectedPreuves,
} from './collect-preuves.repository';

export interface PreuvesByOrigin {
  mesure: CollectedPreuves;
  demande: CollectedPreuves;
  audit: CollectedPreuves;
}

export interface CollectAuditPreuvesInput {
  collectiviteId: number;
  referentielId: ReferentielId;
  demandeId: number;
  auditId: number;
  user: AuthenticatedUser;
}

@Injectable()
export class CollectAuditPreuvesService {
  private readonly logger = new Logger(CollectAuditPreuvesService.name);

  constructor(
    private readonly repository: CollectPreuvesRepository,
    private readonly permissions: PermissionService
  ) {}

  async collect(
    input: CollectAuditPreuvesInput
  ): Promise<Result<PreuvesByOrigin, PreuvesArchiveError>> {
    const { collectiviteId, referentielId, demandeId, auditId, user } = input;

    try {
      const canReadConfidentielResult = await this.permissions.isAllowed(
        user,
        'collectivites.documents.read_confidentiel',
        ResourceType.COLLECTIVITE,
        { collectiviteId }
      );
      const canReadConfidentiel = canReadConfidentielResult.success;

      const [complementaire, reglementaire, labellisation, audit] =
        await Promise.all([
          this.repository.getComplementairePreuves({
            collectiviteId,
            referentielId,
            canReadConfidentiel,
          }),
          this.repository.getReglementairePreuves({
            collectiviteId,
            referentielId,
            canReadConfidentiel,
          }),
          this.repository.getLabellisationPreuves({
            collectiviteId,
            demandeId,
            canReadConfidentiel,
          }),
          this.repository.getAuditPreuves({
            collectiviteId,
            auditId,
            canReadConfidentiel,
          }),
        ]);

      if (!complementaire.success) return complementaire;
      if (!reglementaire.success) return reglementaire;
      if (!labellisation.success) return labellisation;
      if (!audit.success) return audit;

      return success({
        mesure: {
          files: [...complementaire.data.files, ...reglementaire.data.files],
          missingFiles: [
            ...complementaire.data.missingFiles,
            ...reglementaire.data.missingFiles,
          ],
          links: [...complementaire.data.links, ...reglementaire.data.links],
        },
        demande: labellisation.data,
        audit: audit.data,
      });
    } catch (error) {
      this.logger.error(
        `Liste des preuves de l'audit ${auditId}: ${getErrorMessage(error)}`
      );
      return failure(
        PreuvesArchiveErrorEnum.COLLECT_PREUVES_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }
}
