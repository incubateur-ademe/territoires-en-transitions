import { AiPlanImportJobOptions } from '../models/ai-plan-import-job';
import { AiPlanImportProfile } from '../models/import-profile';
import type { StepStates } from '../pipeline/pipeline-step-states';

/** Options validées par le profil avant tout stockage ou enfilement. */
export type ImportAdmission = {
  options: AiPlanImportJobOptions & { profile: AiPlanImportProfile };
  createProvisionalPlan: boolean;
  initialStepStates?: StepStates;
};
