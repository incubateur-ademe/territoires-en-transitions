import { AiPlanImportJobOptions } from '../models/ai-plan-import-job';
import { AiPlanImportProfile } from '../models/import-profile';
import type { StepStates } from '../pipeline/pipeline-step-states';
import type { PlanType } from '@tet/domain/plans';

export type ImportAdmissionInput = {
  collectiviteId: number;
  options: AiPlanImportJobOptions;
  /** Type lu par le coordinateur pour une nouvelle admission. */
  planType?: PlanType;
};

/** Options validées par le profil avant tout stockage ou enfilement. */
export type ImportAdmission = {
  options: AiPlanImportJobOptions & { profile: AiPlanImportProfile };
  createProvisionalPlan: boolean;
  initialStepStates?: StepStates;
};
