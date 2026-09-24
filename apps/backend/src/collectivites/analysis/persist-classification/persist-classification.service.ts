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
        fiches: outcome.report.fiches.map(toFicheVolets),
        tx,
      });
    if (!saveResult.success) {
      return failure({ step: 'save_volets', cause: saveResult.error });
    }

    const reportResult = await this.jobRepository.recordClassificationReport({
      id: job.id,
      report: outcome.report,
      tx,
    });
    if (!reportResult.success) {
      return failure({ step: 'record_report', cause: reportResult.error });
    }

    return success(undefined);
  }
}
