import { Injectable } from '@nestjs/common';
import { PlanVerificationRepository } from '@tet/backend/plans/plans/verify-plan/plan-verification.repository';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import { aiPlanImportJobErrorMessages } from '../ai-plan-import.errors';
import { AiPlanImportJob } from '../models/ai-plan-import-job';
import { ImportJobStats } from '../models/import-job-stats';
import { PlanDraft } from '../models/plan-draft';
import { ImportReport } from '../models/import-report';
import { StepStates } from '../pipeline/run-import-pipeline';

type CompletePlanImportInput = {
  job: AiPlanImportJob;
  planId: number;
  draft?: PlanDraft;
  report?: ImportReport;
  stepStates: StepStates;
  stats: ImportJobStats;
  requiresVerification?: boolean;
};

/** Finalise le plan et son job dans la transaction de création de l'appelant. */
@Injectable()
export class CompletePlanImportService {
  constructor(
    private readonly jobs: AiPlanImportJobRepository,
    private readonly verification: PlanVerificationRepository
  ) {}

  async complete(
    {
      job,
      planId,
      draft,
      report,
      stepStates,
      stats,
      requiresVerification = true,
    }: CompletePlanImportInput,
    tx: Transaction
  ): Promise<Result<number, string>> {
    const marked = await this.verification.markAsImportedByAi(
      { planId, requiresVerification },
      tx
    );
    if (!marked.success) {
      return failure(aiPlanImportJobErrorMessages.PLAN_MARK_FAILED);
    }
    const done = await this.jobs.markDone({
      id: job.id,
      attempt: job.attempt,
      draft,
      report,
      stepStates,
      createdPlanId: planId,
      stats,
      tx,
    });
    return done.success
      ? success(planId)
      : failure(aiPlanImportJobErrorMessages.JOB_COMPLETION_FAILED);
  }
}
