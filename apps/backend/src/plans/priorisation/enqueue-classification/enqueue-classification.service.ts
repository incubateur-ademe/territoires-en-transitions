import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import { Queue } from 'bullmq';
import { ClassificationLeviersJobRepository } from '../classification-leviers-job.repository';
import {
  ClassificationLeviersErrorEnum,
  type ClassificationLeviersError,
} from '../classification-leviers.errors';
import {
  CLASSIFICATION_LEVIERS_QUEUE_NAME,
  type ClassificationLeviersJobData,
} from '../classification-leviers.queue';
import { GetAxeRepository } from '@tet/backend/plans/axes/get-axe/get-axe.repository';
import { EnqueueClassificationInput } from './enqueue-classification.input';

const GENERATE_CLASSIFICATION_JOB_NAME = 'generate-classification';

export const MAX_FICHES_PER_CLASSIFICATION = 500;

@Injectable()
export class EnqueueClassificationService {
  private readonly logger = new Logger(EnqueueClassificationService.name);

  constructor(
    private readonly permissions: PermissionService,
    private readonly getAxeRepository: GetAxeRepository,
    private readonly jobRepository: ClassificationLeviersJobRepository,
    private readonly listFichesService: ListFichesService,
    @InjectQueue(CLASSIFICATION_LEVIERS_QUEUE_NAME)
    private readonly queue: Queue<ClassificationLeviersJobData>
  ) {}

  async enqueue(
    { planId }: EnqueueClassificationInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<{ jobId: string }, ClassificationLeviersError>> {
    const axeResult = await this.getAxeRepository.getAxe(planId);
    if (!axeResult.success) {
      return failure(ClassificationLeviersErrorEnum.PLAN_NOT_FOUND);
    }
    const axe = axeResult.data;

    const isAllowed = await this.isAllowedToClassify(user, axe.collectiviteId);
    if (!isAllowed) {
      return failure(ClassificationLeviersErrorEnum.PLAN_NOT_FOUND);
    }

    const isSousAxe = axe.parent !== null;
    if (isSousAxe) {
      return failure(ClassificationLeviersErrorEnum.NOT_A_PLAN);
    }

    const volumetry = await this.checkVolumetry(axe.collectiviteId, planId);
    if (!volumetry.success) {
      return volumetry;
    }

    const jobResult = await this.jobRepository.createUnlessInFlight({
      collectiviteId: axe.collectiviteId,
      planId,
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

  private async checkVolumetry(
    collectiviteId: number,
    planId: number
  ): Promise<Result<undefined, ClassificationLeviersError>> {
    const fiches = await this.listFichesService.listFichesNonRestreintesOfPlan({
      collectiviteId,
      planId,
    });

    if (fiches.length === 0) {
      return failure(ClassificationLeviersErrorEnum.NO_FICHE_TO_CLASSIFY);
    }

    if (fiches.length > MAX_FICHES_PER_CLASSIFICATION) {
      return failure(ClassificationLeviersErrorEnum.TOO_MANY_FICHES);
    }

    return success(undefined);
  }

  private async addToQueue(
    jobId: string
  ): Promise<Result<{ jobId: string }, ClassificationLeviersError>> {
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
      return failure(ClassificationLeviersErrorEnum.CREATE_JOB_ERROR);
    }
  }
}
