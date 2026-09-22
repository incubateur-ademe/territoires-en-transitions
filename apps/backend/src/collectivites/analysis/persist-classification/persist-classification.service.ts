import { Injectable } from '@nestjs/common';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { AnalysisJobRepository } from '../analysis-job.repository';
import { EnjeuRepositories } from '../enjeu.repositories';
import { type AnalysisPersistFailure } from '../models/analysis.errors';
import { ClassificationOutcome } from '../models/classification-outcome';
import { AnalysisJob } from '../models/analysis-job';
import { ClassifiedFiche } from '../pipeline/classify-fiches/apply-classification';
import { FicheVolets } from '../volet.repository';

const toFicheVolets = ({ ficheId, volets }: ClassifiedFiche): FicheVolets => ({
  ficheId,
  volets,
});

@Injectable()
export class PersistClassificationService {
  constructor(
    private readonly jobRepository: AnalysisJobRepository,
    private readonly enjeuRepositories: EnjeuRepositories
  ) {}

  async persist({
    job,
    outcome,
    tx,
  }: {
    job: AnalysisJob;
    outcome: ClassificationOutcome;
    tx: Transaction;
  }): Promise<Result<undefined, AnalysisPersistFailure>> {
    const saveResult = await this.enjeuRepositories
      .voletsOf(job.enjeu)
      .saveVolets({
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
