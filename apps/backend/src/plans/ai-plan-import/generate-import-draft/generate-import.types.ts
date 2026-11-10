import { ImportJobStats } from '../models/import-job-stats';
import { ImportReport } from '../models/import-report';
import { PlanDraft } from '../models/plan-draft';
import { PlanRecap } from '../notify-plan-imported/plan-recap';
import { StepName, StepStates } from '../pipeline/run-import-pipeline';

export type ImportFailureOptions = {
  attempt?: number;
  draft?: PlanDraft;
  stepStates?: StepStates;
  failedStep?: StepName;
  stats?: ImportJobStats;
  dropCheckpoint?: boolean;
  report?: ImportReport;
};

export type ImportGenerationFailure = ImportFailureOptions & {
  message: string;
  reason: string;
};

export type GeneratedImport = {
  planId: number;
  createdFicheIds: number[];
  recap: PlanRecap;
};
