import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import {
  AI_PLAN_IMPORT_MAX_IN_FLIGHT_JOBS,
  AI_PLAN_IMPORT_MAX_SOURCE_BYTES,
  AI_PLAN_IMPORT_MAX_UNCOMPRESSED_BYTES,
  AI_PLAN_IMPORT_SOURCE_BUCKET,
} from '../ai-plan-import.constants';
import {
  AiPlanImportErrorEnum,
  type AiPlanImportError,
} from '../ai-plan-import.errors';
import {
  AI_PLAN_IMPORT_QUEUE_NAME,
  type AiPlanImportJobData,
} from '../ai-plan-import.queue';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import { AiPlanImportJobOptions } from '../models/ai-plan-import-job.table';
import { removeSourceObject } from '../remove-source-object';
import { detectSourceMimeType, XLSX_MIME } from './detect-source-mime-type';
import { validateXlsxArchive } from './validate-xlsx-archive';

const GENERATE_IMPORT_DRAFT_JOB_NAME = 'generate-import-draft';

export type EnqueueImportInput = {
  collectiviteId: number;
  user: AuthenticatedUser;
  file: { buffer: Buffer; mimeType: string; size: number };
  options: AiPlanImportJobOptions;
};

@Injectable()
export class EnqueueImportService {
  private readonly logger = new Logger(EnqueueImportService.name);

  constructor(
    private readonly permissions: PermissionService,
    private readonly repository: AiPlanImportJobRepository,
    private readonly supabase: SupabaseService,
    @InjectQueue(AI_PLAN_IMPORT_QUEUE_NAME)
    private readonly queue: Queue<AiPlanImportJobData>
  ) {}

  async enqueue(
    input: EnqueueImportInput
  ): Promise<Result<{ jobId: string }, AiPlanImportError>> {
    const { collectiviteId, user, file, options } = input;

    const isAllowed = await this.permissions.isAllowed(
      user,
      'plans.fiches.import',
      ResourceType.COLLECTIVITE,
      collectiviteId,
      true
    );
    if (!isAllowed) {
      return failure(AiPlanImportErrorEnum.UNAUTHORIZED);
    }

    if (file.size > AI_PLAN_IMPORT_MAX_SOURCE_BYTES) {
      return failure(AiPlanImportErrorEnum.FILE_TOO_LARGE);
    }

    const mimeType = detectSourceMimeType(file.buffer, file.mimeType);
    if (mimeType === null) {
      return failure(AiPlanImportErrorEnum.UNSUPPORTED_FILE_TYPE);
    }

    if (mimeType === XLSX_MIME) {
      const archive = validateXlsxArchive(
        file.buffer,
        AI_PLAN_IMPORT_MAX_UNCOMPRESSED_BYTES
      );
      if (!archive.success) {
        return failure(
          archive.error.kind === 'not_xlsx'
            ? AiPlanImportErrorEnum.UNSUPPORTED_FILE_TYPE
            : AiPlanImportErrorEnum.FILE_TOO_LARGE
        );
      }
    }

    const inFlight = await this.repository.countInFlight();
    if (!inFlight.success) {
      return inFlight;
    }
    if (inFlight.data >= AI_PLAN_IMPORT_MAX_IN_FLIGHT_JOBS) {
      return failure(AiPlanImportErrorEnum.TOO_MANY_IN_FLIGHT_JOBS);
    }

    const sourcePath = `${collectiviteId}/${randomUUID()}`;
    const created = await this.repository.createOrGetInFlight({
      collectiviteId,
      createdBy: user.id,
      sourcePath,
      options,
    });
    if (!created.success) {
      return created;
    }
    const jobId = created.data.id;

    const stored = await this.supabase.saveInStorage({
      bucket: AI_PLAN_IMPORT_SOURCE_BUCKET,
      path: sourcePath,
      file: file.buffer,
      mimeType,
    });
    if (!stored.success) {
      await this.cleanupPendingJob(jobId);
      return failure(AiPlanImportErrorEnum.STORAGE_ERROR);
    }

    try {
      await this.queue.add(
        GENERATE_IMPORT_DRAFT_JOB_NAME,
        { jobId },
        { jobId }
      );
    } catch (error) {
      this.logger.error(
        `Mise en file d'attente du job d'import ${jobId}: ${getErrorMessage(error)}`
      );
      await removeSourceObject(this.supabase, sourcePath);
      await this.cleanupPendingJob(jobId);
      return failure(AiPlanImportErrorEnum.CREATE_JOB_ERROR);
    }

    return success({ jobId });
  }

  private async cleanupPendingJob(jobId: string): Promise<void> {
    const cleanup = await this.repository.deleteIfPending(jobId);
    if (!cleanup.success) {
      this.logger.error(
        `Nettoyage de la ligne pending ${jobId} après échec de mise en file d'attente: ${cleanup.error} — la collectivité reste bloquée jusqu'à intervention`
      );
    }
  }
}
