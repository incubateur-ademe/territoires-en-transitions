import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import { Queue } from 'bullmq';
import { ClassificationVoletsJobRepository } from '../classification-volets-job.repository';
import {
  ClassificationVoletsErrorEnum,
  type ClassificationVoletsError,
} from '../classification-volets.errors';
import { FicheActionVoletGesRepository } from '../fiche-action-volet-ges.repository';
import {
  MOBILISATION_VOLETS_QUEUE_NAME,
  type MobilisationVoletsJobData,
} from '../mobilisation-volets.queue';
import { EnqueueMobilisationInput } from './enqueue-mobilisation.input';

const GENERATE_MOBILISATION_JOB_NAME = 'generate-mobilisation';

@Injectable()
export class EnqueueMobilisationService {
  private readonly logger = new Logger(EnqueueMobilisationService.name);

  constructor(
    private readonly permissions: PermissionService,
    private readonly jobRepository: ClassificationVoletsJobRepository,
    private readonly ficheVoletRepository: FicheActionVoletGesRepository,
    @InjectQueue(MOBILISATION_VOLETS_QUEUE_NAME)
    private readonly queue: Queue<MobilisationVoletsJobData>
  ) {}

  async enqueue(
    { collectiviteId, enjeu }: EnqueueMobilisationInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<{ jobId: string }, ClassificationVoletsError>> {
    const isAllowed = await this.isAllowedToAnalyse(user, collectiviteId);
    if (!isAllowed) {
      return failure(ClassificationVoletsErrorEnum.COLLECTIVITE_NOT_FOUND);
    }

    const hasVoletsResult =
      await this.ficheVoletRepository.hasVoletsOfCollectivite(collectiviteId);
    if (!hasVoletsResult.success) {
      return failure(ClassificationVoletsErrorEnum.GET_JOB_ERROR);
    }
    if (!hasVoletsResult.data) {
      return failure(ClassificationVoletsErrorEnum.NO_VOLET_TO_SCORE);
    }

    const jobResult = await this.jobRepository.createUnlessInFlight({
      collectiviteId,
      enjeu,
      etape: 'mobilisation',
      createdBy: user.id,
    });
    if (!jobResult.success) {
      return jobResult;
    }

    return this.addToQueue(jobResult.data.id);
  }

  private async isAllowedToAnalyse(
    user: AuthenticatedUser,
    collectiviteId: number
  ): Promise<boolean> {
    const permissionResult = await this.permissions.isAllowed(
      user,
      PermissionOperationEnum['PLANS.FICHES.BULK_UPDATE'],
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );
    return permissionResult.success;
  }

  private async addToQueue(
    jobId: string
  ): Promise<Result<{ jobId: string }, ClassificationVoletsError>> {
    try {
      await this.queue.add(
        GENERATE_MOBILISATION_JOB_NAME,
        { jobId },
        { jobId }
      );
      return success({ jobId });
    } catch (error) {
      this.logger.error(
        `Enfilement du job de mobilisation ${jobId}: ${getErrorMessage(error)}`
      );
      const compensated = await this.jobRepository.markFailed(
        jobId,
        "L'enfilement du job a échoué"
      );
      if (!compensated.success) {
        this.logger.error(
          `Job ${jobId} laissé en vol : la compensation a échoué (${compensated.error})`
        );
      }
      return failure(ClassificationVoletsErrorEnum.CREATE_JOB_ERROR);
    }
  }
}
