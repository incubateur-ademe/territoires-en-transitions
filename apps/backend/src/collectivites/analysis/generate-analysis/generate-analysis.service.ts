import { Injectable, Logger } from '@nestjs/common';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { AnalysisJobRepository } from '../analysis-job.repository';
import { AnalysisJobErrorEnum } from '../analysis-job.errors';
import { ClassifyBatchOutcome } from '../classify-batch/classify-batch.service';
import {
  PersistClassificationService,
  toClassificationOutcome,
} from '../persist-classification/persist-classification.service';
import { PersistMobilisationService } from '../persist-mobilisation/persist-mobilisation.service';
import { ScoreMobilisationService } from '../score-mobilisation/score-mobilisation.service';
import {
  type AnalysisError,
  type AnalysisPersistFailure,
} from '../models/analysis.errors';
import { AnalysisJobStatusEnum } from '../models/analysis-job';

@Injectable()
export class GenerateAnalysisService {
  private readonly logger = new Logger(GenerateAnalysisService.name);

  constructor(
    private readonly jobRepository: AnalysisJobRepository,
    private readonly classificationService: PersistClassificationService,
    private readonly scoreMobilisationService: ScoreMobilisationService,
    private readonly persistMobilisationService: PersistMobilisationService,
    private readonly transactionManager: TransactionManager
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

    const isAlreadyDone = job.status === AnalysisJobStatusEnum.DONE;
    if (isAlreadyDone) {
      this.logger.log(`Job ${jobId} already done, redelivery ignored`);
      return success(undefined);
    }

    const isClassificationComplete =
      classifications.length === job.totalBatches;
    if (!isClassificationComplete) {
      const message = `Analyse interrompue : ${classifications.length} lot(s) classés sur ${job.totalBatches}.`;
      await this.recordTerminalFailure(jobId, message);
      return failure({ kind: 'interrupted', jobId, message });
    }

    const outcome = toClassificationOutcome(classifications);

    const scoreResult = await this.scoreMobilisationService.score(job, outcome);
    if (!scoreResult.success) {
      return scoreResult;
    }
    const { leviers } = scoreResult.data;

    const persistResult = await this.transactionManager.executeSingle<
      undefined,
      AnalysisPersistFailure
    >(async (tx) => {
      const classificationResult = await this.classificationService.persist({
        job,
        outcome,
        tx,
      });
      if (!classificationResult.success) {
        return classificationResult;
      }

      return this.persistMobilisationService.persist({
        job,
        leviers,
        tx,
      });
    });
    if (persistResult.success) {
      return success(undefined);
    }

    const { step, cause } = persistResult.error;
    const message = `Écriture de l'analyse impossible (${step}: ${cause}). Aucune écriture n'a eu lieu.`;
    await this.recordTerminalFailure(jobId, message);

    return failure({ kind: 'interrupted', jobId, message });
  }

  async recordTerminalFailure(jobId: string, message: string): Promise<void> {
    const failedResult = await this.jobRepository.markFailed(jobId, message);
    if (failedResult.success) {
      return;
    }

    const isCauseAlreadyRecorded =
      failedResult.error === AnalysisJobErrorEnum.JOB_TRANSITION_REFUSED;
    if (isCauseAlreadyRecorded) {
      this.logger.log(
        `Job ${jobId} failure already recorded, keeping the more precise cause`
      );
      return;
    }

    this.logger.error(
      `Could not record failure of job ${jobId} (${failedResult.error})`
    );
  }
}
