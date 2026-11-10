import { Result } from '@tet/backend/utils/result.type';
import { AiPlanImportJob } from '../models/ai-plan-import-job';
import { StoredImportCheckpoint } from '../models/import-checkpoint';
import { ImportJobStats } from '../models/import-job-stats';
import { ImportReport } from '../models/import-report';
import { PlanDraft } from '../models/plan-draft';
import { PlanRecap } from '../notify-plan-imported/plan-recap';
import { StepName, StepStates } from '../pipeline/run-import-pipeline';
import { ImportJobTelemetry } from './import-job-telemetry';

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
  stats: ImportJobStats;
};

export interface ImportGenerator<Checkpoint = StoredImportCheckpoint> {
  generate(
    job: AiPlanImportJob,
    checkpoint: Checkpoint | null,
    telemetry: ImportJobTelemetry
  ): Promise<Result<GeneratedImport, ImportGenerationFailure>>;
}
