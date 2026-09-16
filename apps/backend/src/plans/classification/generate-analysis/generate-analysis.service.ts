import { Injectable, Logger } from '@nestjs/common';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { ClassificationVoletsJobRepository } from '../classification-volets-job.repository';
import { ClassificationVoletsErrorEnum } from '../classification-volets.errors';
import { ClassifyBatchOutcome } from '../classify-batch/classify-batch.service';
import { GenerateClassificationService } from '../generate-classification/generate-classification.service';
import { GenerateMobilisationService } from '../generate-mobilisation/generate-mobilisation.service';
import { type AnalysisError } from '../models/analysis-error';
import { ClassificationVoletsJobStatusEnum } from '../models/classification-volets-job';

@Injectable()
export class GenerateAnalysisService {
  private readonly logger = new Logger(GenerateAnalysisService.name);

  constructor(
    private readonly jobRepository: ClassificationVoletsJobRepository,
    private readonly classificationService: GenerateClassificationService,
    private readonly mobilisationService: GenerateMobilisationService
  ) {}

  async generate(
    jobId: string,
    classifications: ClassifyBatchOutcome[]
  ): Promise<Result<undefined, AnalysisError>> {
    const jobResult = await this.jobRepository.getById(jobId);
    if (!jobResult.success) {
      return failure({ kind: 'job_unreadable', jobId, cause: jobResult.error });
    }
    const job = jobResult.data;

    const isAlreadyDone = job.status === ClassificationVoletsJobStatusEnum.DONE;
    if (isAlreadyDone) {
      this.logger.log(`Job ${jobId} déjà terminé, ré-livraison ignorée`);
      return success(undefined);
    }

    const persistResult = await this.classificationService.persist(
      job,
      classifications
    );
    if (!persistResult.success) {
      return persistResult;
    }

    return this.mobilisationService.score(job, persistResult.data);
  }

  async recordTerminalFailure(jobId: string, message: string): Promise<void> {
    const failedResult = await this.jobRepository.markFailed(jobId, message);
    if (failedResult.success) {
      return;
    }

    const isCauseAlreadyRecorded =
      failedResult.error ===
      ClassificationVoletsErrorEnum.JOB_TRANSITION_REFUSED;
    if (isCauseAlreadyRecorded) {
      this.logger.log(
        `Échec du job ${jobId} déjà enregistré, cause plus précise conservée`
      );
      return;
    }

    this.logger.error(
      `Enregistrement de l'échec du job ${jobId} impossible (${failedResult.error})`
    );
  }
}
