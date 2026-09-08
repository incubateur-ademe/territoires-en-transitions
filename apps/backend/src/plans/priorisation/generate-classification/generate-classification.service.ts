import { Injectable, Logger } from '@nestjs/common';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { ClassificationLeviersJobRepository } from '../classification-leviers-job.repository';
import { type ClassificationLeviersError } from '../classification-leviers.errors';
import { FicheVolets, FicheVoletsRepository } from '../fiche-volets.repository';
import { ClassificationLeviersJobStatusEnum } from '../models/classification-leviers-job';
import { ClassifiedFiche } from '../pipeline/classify-fiches/apply-classification';
import {
  FICHES_PER_BATCH,
  runClassification,
} from '../pipeline/run-classification';

export type GenerateClassificationError =
  | { kind: 'job_unreadable'; jobId: string; cause: ClassificationLeviersError }
  | {
      kind: 'transition_failed';
      jobId: string;
      cause: ClassificationLeviersError;
    }
  | {
      kind: 'failure_record_failed';
      jobId: string;
      cause: ClassificationLeviersError;
    }
  | { kind: 'interrupted'; jobId: string; message: string };

const toFicheVolets = ({ ficheId, volets }: ClassifiedFiche): FicheVolets => ({
  ficheId,
  volets,
});

@Injectable()
export class GenerateClassificationService {
  private readonly logger = new Logger(GenerateClassificationService.name);

  constructor(
    private readonly jobRepository: ClassificationLeviersJobRepository,
    private readonly listFichesService: ListFichesService,
    private readonly llm: LlmService,
    private readonly ficheVoletsRepository: FicheVoletsRepository
  ) {}

  async generate(
    jobId: string
  ): Promise<Result<undefined, GenerateClassificationError>> {
    const jobResult = await this.jobRepository.getById(jobId);
    if (!jobResult.success) {
      return failure({ kind: 'job_unreadable', jobId, cause: jobResult.error });
    }
    const job = jobResult.data;

    const isAlreadyDone =
      job.status === ClassificationLeviersJobStatusEnum.DONE;
    if (isAlreadyDone) {
      this.logger.log(`Job ${jobId} déjà terminé, ré-livraison ignorée`);
      return success(undefined);
    }

    const fiches = await this.listFichesService.listFichesNonRestreintesOfPlan({
      collectiviteId: job.collectiviteId,
      planId: job.planId,
    });

    if (fiches.length === 0) {
      return this.interrupt(jobId, 'Aucune fiche à classer dans ce plan');
    }

    const totalBatches = Math.ceil(fiches.length / FICHES_PER_BATCH);
    const runningResult = await this.jobRepository.markRunning(
      jobId,
      totalBatches
    );
    if (!runningResult.success) {
      return failure({
        kind: 'transition_failed',
        jobId,
        cause: runningResult.error,
      });
    }

    const run = await runClassification(this.llm, {
      fiches: fiches.map(({ ficheId, titre, description }) => ({
        ficheId,
        titre: titre ?? '',
        description,
      })),
      onBatchProcessed: (processedBatches) => {
        void this.jobRepository.recordProcessedBatches(jobId, processedBatches);
      },
    });

    if (run.kind === 'too_many_failed_batches') {
      return this.interrupt(
        jobId,
        `Classification abandonnée: ${run.failedBatches} batches en échec sur ${run.totalBatches}`
      );
    }

    const savedResult = await this.ficheVoletsRepository.saveVolets(
      job.collectiviteId,
      run.draft.fiches.map(toFicheVolets)
    );
    if (!savedResult.success) {
      return this.interrupt(jobId, "L'enregistrement des volets a échoué");
    }

    const doneResult = await this.jobRepository.markDone(
      jobId,
      run.draft,
      run.tokens
    );
    if (!doneResult.success) {
      return failure({
        kind: 'transition_failed',
        jobId,
        cause: doneResult.error,
      });
    }

    return success(undefined);
  }

  async recordTerminalFailure(jobId: string, message: string): Promise<void> {
    const failedResult = await this.jobRepository.markFailed(jobId, message);
    if (!failedResult.success) {
      this.logger.error(
        `Enregistrement de l'échec du job ${jobId} impossible (${failedResult.error})`
      );
    }
  }

  private async interrupt(
    jobId: string,
    message: string
  ): Promise<Result<undefined, GenerateClassificationError>> {
    const failedResult = await this.jobRepository.markFailed(jobId, message);
    if (!failedResult.success) {
      return failure({
        kind: 'failure_record_failed',
        jobId,
        cause: failedResult.error,
      });
    }
    return failure({ kind: 'interrupted', jobId, message });
  }
}
