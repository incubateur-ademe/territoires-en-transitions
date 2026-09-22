import { Injectable } from '@nestjs/common';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Enjeu, LEVIER_ID_BY_NOM } from '@tet/domain/shared';
import { AnalysisJobRepository } from '../analysis-job.repository';
import { ClassifyBatchOutcome } from '../classify-batch/classify-batch.service';
import { FicheActionVoletGesRepository } from '../fiche-action-volet-ges.repository';
import { type AnalysisPersistFailure } from '../models/analysis.errors';
import { ClassificationOutcome } from '../models/classification-outcome';
import { AnalysisJob } from '../models/analysis-job';
import { ClassifiedFiche } from '../pipeline/classify-fiches/apply-classification';
import { FicheVolet } from '../pipeline/calculate-mobilisation/group-volets-by-levier';
import { FicheVolets, VoletRepository } from '../volet.repository';

const toFicheVolets = ({ ficheId, volets }: ClassifiedFiche): FicheVolets => ({
  ficheId,
  volets,
});

const toVoletMobilisations = (fiches: ClassifiedFiche[]): FicheVolet[] =>
  fiches.flatMap(({ ficheId, volets }) =>
    volets.map(({ levier, categorie }) => ({
      ficheId,
      levierId: LEVIER_ID_BY_NOM[levier],
      categorie,
    }))
  );

export const toClassificationOutcome = (
  classifications: ClassifyBatchOutcome[]
): ClassificationOutcome => {
  const classifiedFiches = classifications.flatMap(
    ({ classified }) => classified
  );

  return {
    draft: { fiches: classifiedFiches },
    fiches: classifications.flatMap(({ sources }) => sources),
    volets: toVoletMobilisations(classifiedFiches),
  };
};

@Injectable()
export class PersistClassificationService {
  constructor(
    private readonly jobRepository: AnalysisJobRepository,
    private readonly ficheActionVoletGesRepository: FicheActionVoletGesRepository
  ) {}

  private readonly repositoriesByEnjeu: Record<Enjeu, VoletRepository> = {
    ges: this.ficheActionVoletGesRepository,
  };

  async persist({
    job,
    outcome,
    tx,
  }: {
    job: AnalysisJob;
    outcome: ClassificationOutcome;
    tx: Transaction;
  }): Promise<Result<undefined, AnalysisPersistFailure>> {
    const saveResult = await this.repositoriesByEnjeu[job.enjeu].saveVolets({
      collectiviteId: job.collectiviteId,
      fiches: outcome.draft.fiches.map(toFicheVolets),
      createdBy: job.createdBy,
      tx,
    });
    if (!saveResult.success) {
      return failure({ step: 'save_volets', cause: saveResult.error });
    }

    const draftResult = await this.jobRepository.recordClassificationDraft({
      id: job.id,
      draft: outcome.draft,
      tx,
    });
    if (!draftResult.success) {
      return failure({ step: 'record_draft', cause: draftResult.error });
    }

    return success(undefined);
  }
}
