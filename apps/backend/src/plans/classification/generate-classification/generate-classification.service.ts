import { Injectable, Logger } from '@nestjs/common';
import { sumTokenUsage } from '@tet/backend/utils/llm/token-usage';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { Enjeu, LEVIER_ID_BY_NOM } from '@tet/domain/shared';
import { ClassificationVoletsJobRepository } from '../classification-volets-job.repository';
import { ClassifyBatchOutcome } from '../classify-batch/classify-batch.service';
import { FicheActionVoletGesRepository } from '../fiche-action-volet-ges.repository';
import { type AnalysisError } from '../models/analysis-error';
import { ClassificationOutcome } from '../models/classification-outcome';
import { ClassificationVoletsJob } from '../models/classification-volets-job';
import { ClassifiedFiche } from '../pipeline/classify-fiches/apply-classification';
import { FicheVolet } from '../pipeline/calculate-mobilisation/group-volets-by-levier';
import { FicheVolets, VoletRepository } from '../volet.repository';

type PersistFailure = { step: 'save_volets' | 'record_draft'; cause: string };

const toFicheVolets = ({ ficheId, volets }: ClassifiedFiche): FicheVolets => ({
  ficheId,
  volets,
});

const toScoredVolets = (fiches: ClassifiedFiche[]): FicheVolet[] =>
  fiches.flatMap(({ ficheId, volets }) =>
    volets.map(({ levier, categorie }) => ({
      ficheId,
      levierId: LEVIER_ID_BY_NOM[levier],
      categorie,
    }))
  );

@Injectable()
export class GenerateClassificationService {
  private readonly logger = new Logger(GenerateClassificationService.name);

  constructor(
    private readonly jobRepository: ClassificationVoletsJobRepository,
    private readonly ficheActionVoletGesRepository: FicheActionVoletGesRepository,
    private readonly transactionManager: TransactionManager
  ) {}

  private readonly repositoriesByEnjeu: Record<Enjeu, VoletRepository> = {
    ges: this.ficheActionVoletGesRepository,
  };

  async persist(
    job: ClassificationVoletsJob,
    classifications: ClassifyBatchOutcome[]
  ): Promise<Result<ClassificationOutcome, AnalysisError>> {
    const jobId = job.id;
    const classifiedFiches = classifications.flatMap(
      ({ classified }) => classified
    );
    const draft = { fiches: classifiedFiches };
    const repository = this.repositoriesByEnjeu[job.enjeu];

    const persistResult = await this.transactionManager.executeSingle<
      undefined,
      PersistFailure
    >(async (tx) => {
      const saveResult = await repository.saveVolets({
        collectiviteId: job.collectiviteId,
        fiches: classifiedFiches.map(toFicheVolets),
        createdBy: job.createdBy,
        tx,
      });
      if (!saveResult.success) {
        return failure({
          step: 'save_volets' as const,
          cause: saveResult.error,
        });
      }

      const draftResult = await this.jobRepository.recordClassificationDraft({
        id: jobId,
        draft,
        tx,
      });
      if (!draftResult.success) {
        return failure({
          step: 'record_draft' as const,
          cause: draftResult.error,
        });
      }

      return success(undefined);
    });

    if (!persistResult.success) {
      return this.interrupt(
        jobId,
        `L'enregistrement du classement a échoué (${persistResult.error.step})`
      );
    }

    return success({
      draft,
      fiches: classifications.flatMap(({ sources }) => sources),
      volets: toScoredVolets(classifiedFiches),
      tokens: sumTokenUsage(classifications.map(({ tokens }) => tokens)),
    });
  }

  private async interrupt(
    jobId: string,
    message: string
  ): Promise<Result<never, AnalysisError>> {
    const failedResult = await this.jobRepository.markFailed(jobId, message);
    if (!failedResult.success) {
      this.logger.error(
        `Enregistrement de l'échec du job ${jobId} impossible (${failedResult.error})`
      );
    }
    return failure({ kind: 'interrupted', jobId, message });
  }
}
