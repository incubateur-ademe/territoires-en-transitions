import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { GetLabellisationService } from '@tet/backend/referentiels/labellisations/get-labellisation.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { ReferentielId } from '@tet/domain/referentiels';
import { ResourceType } from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import { Queue } from 'bullmq';
import {
  auditPreuvesArchiveInFlightStatuses,
  type AuditPreuvesArchiveStatus,
} from '../models/audit-preuves-archive.table';
import {
  PreuvesArchiveErrorEnum,
  type PreuvesArchiveError,
} from '../preuves-archive.errors';
import {
  PREUVES_ARCHIVE_QUEUE_NAME,
  type PreuvesArchiveJobData,
} from '../preuves-archive.queue';
import { PreuvesArchiveRepository } from '../preuves-archive.repository';

const ARCHIVE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const GENERATE_ARCHIVE_JOB_NAME = 'generate-archive';

export interface RequestPreuvesArchiveInput {
  collectiviteId: number;
  referentielId: ReferentielId;
  user: AuthenticatedUser;
}

export interface RequestPreuvesArchiveResult {
  archiveId: string;
  status: AuditPreuvesArchiveStatus;
}

@Injectable()
export class RequestPreuvesArchiveService {
  private readonly logger = new Logger(RequestPreuvesArchiveService.name);

  constructor(
    private readonly permissions: PermissionService,
    private readonly getLabellisationService: GetLabellisationService,
    private readonly repository: PreuvesArchiveRepository,
    @InjectQueue(PREUVES_ARCHIVE_QUEUE_NAME)
    private readonly queue: Queue<PreuvesArchiveJobData>
  ) {}

  async request(
    input: RequestPreuvesArchiveInput
  ): Promise<Result<RequestPreuvesArchiveResult, PreuvesArchiveError>> {
    const { collectiviteId, referentielId, user } = input;

    const isAllowed = await this.permissions.isAllowed(
      user,
      'referentiels.read',
      ResourceType.COLLECTIVITE,
      collectiviteId,
      true
    );
    if (!isAllowed) {
      return failure(
        PreuvesArchiveErrorEnum.UNAUTHORIZED,
        new Error(
          `L'utilisateur ${user.id} n'a pas le droit referentiels.read sur la collectivité ${collectiviteId}`
        )
      );
    }

    const auditIdResult = await this.resolveCurrentAuditId(
      collectiviteId,
      referentielId
    );
    if (!auditIdResult.success) {
      return auditIdResult;
    }
    const auditId = auditIdResult.data;

    const auditeurMembership = await this.repository.getAuditeurMembership({
      auditId,
      userId: user.id,
    });
    if (!auditeurMembership.success) {
      return auditeurMembership;
    }
    if (!auditeurMembership.data) {
      return failure(
        PreuvesArchiveErrorEnum.UNAUTHORIZED,
        new Error(
          `L'utilisateur ${user.id} n'est pas auditeur de l'audit ${auditId} en cours pour la collectivité ${collectiviteId}`
        )
      );
    }

    const expiresAt = new Date(Date.now() + ARCHIVE_TTL_MS).toISOString();
    const createResult = await this.repository.createOrGetInFlight({
      collectiviteId,
      referentielId,
      auditId,
      requestedBy: user.id,
      expiresAt,
    });
    if (!createResult.success) {
      return createResult;
    }

    const archive = createResult.data;

    if (auditPreuvesArchiveInFlightStatuses.includes(archive.status)) {
      try {
        // attempts/backoff/removeOn* viennent de defaultJobOptions sur la queue.
        await this.queue.add(
          GENERATE_ARCHIVE_JOB_NAME,
          { archiveId: archive.id },
          { jobId: archive.id }
        );
      } catch (error) {
        this.logger.error(
          `Enfilement du job d'archive ${archive.id}: ${getErrorMessage(error)}`
        );
        // La ligne pending occuperait l'index unique partiel jusqu'à TTL — on la retire pour permettre un retry immédiat.
        const cleanup = await this.repository.deleteIfPending(archive.id);
        if (!cleanup.success) {
          this.logger.error(
            `Nettoyage de la ligne pending ${archive.id} après échec d'enfilement: ${cleanup.error}`
          );
        }
        return failure(
          PreuvesArchiveErrorEnum.CREATE_ARCHIVE_ERROR,
          error instanceof Error ? error : new Error(getErrorMessage(error))
        );
      }
    }

    return success({ archiveId: archive.id, status: archive.status });
  }

  private async resolveCurrentAuditId(
    collectiviteId: number,
    referentielId: ReferentielId
  ): Promise<Result<number, PreuvesArchiveError>> {
    const audit = await this.getLabellisationService.getCurrentAudit(
      collectiviteId,
      referentielId
    );
    if (audit.success) {
      return success(audit.data.id);
    }

    if (audit.error === 'NOT_FOUND') {
      return failure(
        PreuvesArchiveErrorEnum.AUDIT_NOT_FOUND,
        new Error(
          `Aucun audit en cours pour la collectivité ${collectiviteId} et le référentiel ${referentielId}`
        )
      );
    }
    return failure(
      PreuvesArchiveErrorEnum.CREATE_ARCHIVE_ERROR,
      new Error(
        `Résolution de l'audit courant échouée (collectivité ${collectiviteId}, référentiel ${referentielId})`
      )
    );
  }
}
