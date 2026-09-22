import { Injectable } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { Enjeu } from '@tet/domain/shared';
import { AnalysisJobRepository } from '../analysis-job.repository';
import { CollectiviteVoletGesRepository } from '../collectivite-volet-ges.repository';
import {
  LevierMobilisation,
  MobilisationRepository,
} from '../mobilisation.repository';
import { type AnalysisPersistFailure } from '../models/analysis.errors';
import { AnalysisJob } from '../models/analysis-job';

@Injectable()
export class PersistMobilisationService {
  constructor(
    private readonly jobRepository: AnalysisJobRepository,
    private readonly collectiviteVoletGesRepository: CollectiviteVoletGesRepository
  ) {}

  private readonly mobilisationsByEnjeu: Record<Enjeu, MobilisationRepository> =
    {
      ges: this.collectiviteVoletGesRepository,
    };

  async persist({
    job,
    leviers,
    tx,
  }: {
    job: AnalysisJob;
    leviers: LevierMobilisation[];
    tx: Transaction;
  }): Promise<Result<undefined, AnalysisPersistFailure>> {
    const mobilisationResult = await this.mobilisationsByEnjeu[
      job.enjeu
    ].replaceMobilisation({
      collectiviteId: job.collectiviteId,
      leviers,
      tx,
    });
    if (!mobilisationResult.success) {
      return failure({
        step: 'replace_mobilisation',
        cause: mobilisationResult.error,
      });
    }

    const doneResult = await this.jobRepository.markDone({
      id: job.id,
      tx,
    });
    if (!doneResult.success) {
      return failure({ step: 'mark_done', cause: doneResult.error });
    }

    return success(undefined);
  }
}
