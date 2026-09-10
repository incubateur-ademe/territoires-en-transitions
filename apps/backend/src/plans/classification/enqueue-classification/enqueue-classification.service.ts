import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
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
import {
  CLASSIFICATION_VOLETS_QUEUE_NAME,
  type ClassificationVoletsJobData,
} from '../classification-volets.queue';
import { GetAxeRepository } from '@tet/backend/plans/axes/get-axe/get-axe.repository';
import { EnqueueClassificationInput } from './enqueue-classification.input';

const GENERATE_CLASSIFICATION_JOB_NAME = 'generate-classification';

@Injectable()
export class EnqueueClassificationService {
  private readonly logger = new Logger(EnqueueClassificationService.name);

  constructor(
    private readonly permissions: PermissionService,
    private readonly getAxeRepository: GetAxeRepository,
    private readonly jobRepository: ClassificationVoletsJobRepository,
    private readonly listFichesService: ListFichesService,
    @InjectQueue(CLASSIFICATION_VOLETS_QUEUE_NAME)
    private readonly queue: Queue<ClassificationVoletsJobData>
  ) {}

  async enqueue(
    { planId, enjeu }: EnqueueClassificationInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<{ jobId: string }, ClassificationVoletsError>> {
    const axeResult = await this.getAxeRepository.getAxe(planId);
    if (!axeResult.success) {
      return failure(ClassificationVoletsErrorEnum.PLAN_NOT_FOUND);
    }
    const axe = axeResult.data;

    const isAllowed = await this.isAllowedToClassify(user, axe.collectiviteId);
    if (!isAllowed) {
      return failure(ClassificationVoletsErrorEnum.PLAN_NOT_FOUND);
    }

    const isSousAxe = axe.parent !== null;
    if (isSousAxe) {
      return failure(ClassificationVoletsErrorEnum.NOT_A_PLAN);
    }

    const hasFicheResult = await this.checkPlanHasFicheToClassify(
      { collectiviteId: axe.collectiviteId, planId },
      { user }
    );
    if (!hasFicheResult.success) {
      return hasFicheResult;
    }

    const jobResult = await this.jobRepository.createUnlessInFlight({
      collectiviteId: axe.collectiviteId,
      planId,
      enjeu,
      createdBy: user.id,
    });
    if (!jobResult.success) {
      return jobResult;
    }

    return this.addToQueue(jobResult.data.id);
  }

  private async isAllowedToClassify(
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

  private async checkPlanHasFicheToClassify(
    { collectiviteId, planId }: { collectiviteId: number; planId: number },
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<undefined, ClassificationVoletsError>> {
    const { count } = await this.listFichesService.getFichesActionResumes(
      {
        collectiviteId,
        filters: { planActionIds: [planId], restreint: false },
        queryOptions: { limit: 1, page: 1 },
      },
      { user }
    );

    if (count === 0) {
      return failure(ClassificationVoletsErrorEnum.NO_FICHE_TO_CLASSIFY);
    }

    return success(undefined);
  }

  private async addToQueue(
    jobId: string
  ): Promise<Result<{ jobId: string }, ClassificationVoletsError>> {
    try {
      await this.queue.add(
        GENERATE_CLASSIFICATION_JOB_NAME,
        { jobId },
        { jobId }
      );
      return success({ jobId });
    } catch (error) {
      this.logger.error(
        `Enfilement du job de classification ${jobId}: ${getErrorMessage(
          error
        )}`
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
