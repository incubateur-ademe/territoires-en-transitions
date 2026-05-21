import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import {
  PreuvesArchiveErrorEnum,
  type PreuvesArchiveError,
} from '../preuves-archive.errors';
import {
  CollectPreuvesRepository,
  type CollectedFilePreuve,
  type CollectedLinkPreuve,
} from './collect-preuves.repository';

export interface PreuvesSource {
  files: CollectedFilePreuve[];
  links: CollectedLinkPreuve[];
}

export interface PreuvesByOrigin {
  mesure: PreuvesSource;
  demande: PreuvesSource;
  audit: PreuvesSource;
}

export interface ListPreuvesForAuditInput {
  collectiviteId: number;
  demandeId: number;
  auditId: number;
  user: AuthenticatedUser;
}

@Injectable()
export class ListAuditPreuvesService {
  private readonly logger = new Logger(ListAuditPreuvesService.name);

  constructor(
    private readonly repository: CollectPreuvesRepository,
    private readonly permissions: PermissionService
  ) {}

  async list(
    input: ListPreuvesForAuditInput
  ): Promise<Result<PreuvesByOrigin, PreuvesArchiveError>> {
    const { collectiviteId, demandeId, auditId, user } = input;

    try {
      const canReadConfidentiel = await this.permissions.isAllowed(
        user,
        'collectivites.documents.read_confidentiel',
        ResourceType.COLLECTIVITE,
        collectiviteId,
        true
      );

      const [complementaire, reglementaire, labellisation, audit] =
        await Promise.all([
          this.repository.getComplementairePreuves({
            collectiviteId,
            canReadConfidentiel,
          }),
          this.repository.getReglementairePreuves({
            collectiviteId,
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
