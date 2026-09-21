import { InjectFlowProducer } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { Enjeu } from '@tet/domain/shared';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import { FlowProducer } from 'bullmq';
import { chunk } from 'es-toolkit';
import {
  AnalysisJobErrorEnum,
  type AnalysisJobError,
} from '../analysis-job.errors';
import {
  ANALYSIS_FLOW_PRODUCER_NAME,
  ANALYSIS_JOB_OPTIONS,
  ANALYSIS_QUEUE_NAME,
} from '../analysis.queue';
import { AnalysisJobRepository } from '../analysis-job.repository';
import {
  CLASSIFY_BATCH_JOB_OPTIONS,
  CLASSIFY_BATCH_QUEUE_NAME,
  FICHES_PER_BATCH,
} from '../classify-batch/classify-batch.queue';
import {
  FICHES_TO_CLASSIFY_FILTERS,
  toAnalysisDeadline,
} from '../models/analysis-job';
import { FicheToClassify } from '../pipeline/classify-fiches/render-fiches-text';
import { EnqueueAnalysisInput } from './enqueue-analysis.input';

const GENERATE_ANALYSIS_JOB_NAME = 'generate-analysis';
const CLASSIFY_BATCH_JOB_NAME = 'classify-batch';

@Injectable()
export class EnqueueAnalysisService {
  private readonly logger = new Logger(EnqueueAnalysisService.name);

  constructor(
    private readonly permissions: PermissionService,
    private readonly jobRepository: AnalysisJobRepository,
    private readonly listFichesService: ListFichesService,
    @InjectFlowProducer(ANALYSIS_FLOW_PRODUCER_NAME)
    private readonly flow: FlowProducer
  ) {}

  async enqueue(
    { collectiviteId, enjeu }: EnqueueAnalysisInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<{ jobId: string }, AnalysisJobError>> {
    const isCollectiviteVisible = await this.isAllowedToClassify(
      user,
      collectiviteId
    );
    if (!isCollectiviteVisible) {
      return failure(AnalysisJobErrorEnum.COLLECTIVITE_NOT_FOUND);
    }

    const fiches = await this.listFichesToClassify(collectiviteId, user);
    if (fiches.length === 0) {
      return failure(AnalysisJobErrorEnum.NO_FICHE_TO_CLASSIFY);
    }

    const jobResult = await this.jobRepository.createUnlessInFlight({
      collectiviteId,
      enjeu,
      etape: 'classification',
      createdBy: user.id,
    });
    if (!jobResult.success) {
      return jobResult;
    }

    const jobId = jobResult.data.id;

    const batches = chunk(fiches, FICHES_PER_BATCH);
    const runningResult = await this.jobRepository.markRunning(
      jobId,
      batches.length
    );
    if (!runningResult.success) {
      await this.releaseJob(jobId, 'Le demarrage du job a echoue');
      return failure(AnalysisJobErrorEnum.UPDATE_JOB_ERROR);
    }

    return this.spawnFlow({ jobId, enjeu, batches });
  }

  private async listFichesToClassify(
    collectiviteId: number,
    user: AuthenticatedUser
  ): Promise<FicheToClassify[]> {
    const { data: readableFiches } =
      await this.listFichesService.getFichesActionResumes(
        {
          collectiviteId,
          filters: FICHES_TO_CLASSIFY_FILTERS,
          queryOptions: { limit: 'all' },
        },
        { user }
      );

    return readableFiches
      .filter((fiche) => fiche.collectiviteId === collectiviteId)
      .map(({ id, titre, description }) => ({
        ficheId: id,
        titre: titre ?? '',
        description,
      }));
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

  private async releaseJob(jobId: string, message: string): Promise<void> {
    const compensated = await this.jobRepository.markFailed(jobId, message);
    if (!compensated.success) {
      this.logger.error(
        `Job ${jobId} laissé en vol : la compensation a échoué (${compensated.error})`
      );
    }
  }

  private async spawnFlow({
    jobId,
    enjeu,
    batches,
  }: {
    jobId: string;
    enjeu: Enjeu;
    batches: FicheToClassify[][];
  }): Promise<Result<{ jobId: string }, AnalysisJobError>> {
    const deadlineAt = toAnalysisDeadline();

    try {
      await this.flow.add({
        name: GENERATE_ANALYSIS_JOB_NAME,
        queueName: ANALYSIS_QUEUE_NAME,
        data: { jobId },
        opts: { ...ANALYSIS_JOB_OPTIONS, jobId },
        children: batches.map((fiches, rank) => ({
          name: CLASSIFY_BATCH_JOB_NAME,
          queueName: CLASSIFY_BATCH_QUEUE_NAME,
          data: { jobId, enjeu, fiches, deadlineAt },
          opts: {
            ...CLASSIFY_BATCH_JOB_OPTIONS,
            jobId: `${jobId}:${rank}`,
            failParentOnFailure: true,
          },
        })),
      });

      return success({ jobId });
    } catch (error) {
      this.logger.error(
        `Enfilement de l'analyse ${jobId}: ${getErrorMessage(error)}`
      );
      await this.releaseJob(jobId, "L'enfilement du job a échoué");
      return failure(AnalysisJobErrorEnum.CREATE_JOB_ERROR);
    }
  }
}
