import { Injectable, Logger } from '@nestjs/common';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { buildRequesterUser } from '@tet/backend/users/models/auth.models';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { ClassificationLeviersJobRepository } from '../classification-leviers-job.repository';
import { type ClassificationLeviersError } from '../classification-leviers.errors';
import { type FicheLeviersError } from '../fiche-leviers.errors';
import {
  FicheLeviers,
  FicheLeviersRepository,
} from '../fiche-leviers.repository';
import {
  CLASSIFICATION_DEADLINE_MS,
  ClassificationLeviersJobStatusEnum,
} from '../models/classification-leviers-job';
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

type PersistClassificationFailure =
  | { step: 'save_leviers'; cause: FicheLeviersError }
  | { step: 'mark_done'; cause: ClassificationLeviersError };

const toFicheLeviers = ({
  ficheId,
  volets,
}: ClassifiedFiche): FicheLeviers => ({
  ficheId,
  leviers: volets,
});

@Injectable()
export class GenerateClassificationService {
  private readonly logger = new Logger(GenerateClassificationService.name);

  constructor(
    private readonly jobRepository: ClassificationLeviersJobRepository,
    private readonly listFichesService: ListFichesService,
    private readonly llm: LlmService,
    private readonly ficheLeviersRepository: FicheLeviersRepository,
    private readonly transactionManager: TransactionManager
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

    const { data: fiches } =
      await this.listFichesService.getFichesActionResumes(
        {
          collectiviteId: job.collectiviteId,
          filters: { planActionIds: [job.planId], restreint: false },
        },
        { user: buildRequesterUser(job.createdBy) }
      );

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

    const deadline = AbortSignal.timeout(CLASSIFICATION_DEADLINE_MS);
    const classification = await runClassification(this.llm, {
      signal: deadline,
      fiches: fiches.map(({ id, titre, description }) => ({
        ficheId: id,
        titre: titre ?? '',
        description,
      })),
      onBatchProcessed: (processedBatches) => {
        void this.jobRepository.recordProcessedBatches(jobId, processedBatches);
      },
    });

    if (classification.kind === 'too_many_failed_batches') {
      return this.interrupt(
        jobId,
        `Classification abandonnée: ${classification.failedBatches} batches en échec sur ${classification.totalBatches}`
      );
    }

    const persistResult = await this.transactionManager.executeSingle<
      undefined,
      PersistClassificationFailure
    >(async (tx) => {
      const saveResult = await this.ficheLeviersRepository.saveLeviers({
        collectiviteId: job.collectiviteId,
        fiches: classification.draft.fiches.map(toFicheLeviers),
        tx,
      });
      if (!saveResult.success) {
        return failure({
          step: 'save_leviers' as const,
          cause: saveResult.error,
        });
      }

      const doneResult = await this.jobRepository.markDone({
        id: jobId,
        draft: classification.draft,
        tokenUsage: classification.tokens,
        tx,
      });
      if (!doneResult.success) {
        return failure({ step: 'mark_done' as const, cause: doneResult.error });
      }

      return success(undefined);
    });

    if (persistResult.success) {
      return success(undefined);
    }

    if (persistResult.error.step === 'save_leviers') {
      return this.interrupt(
        jobId,
        `L'enregistrement du classement a échoué (${persistResult.error.cause})`
      );
    }

    return failure({
      kind: 'transition_failed',
      jobId,
      cause: persistResult.error.cause,
    });
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
