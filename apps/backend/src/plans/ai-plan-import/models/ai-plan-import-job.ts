import { PlanStatus } from '@tet/domain/plans';
import { createEnumObject } from '@tet/domain/utils';
import { z } from 'zod';
import { StepStates } from '../pipeline/run-import-pipeline';
import { DisableableField } from './disableable-field';
import { ImportJobStats } from './import-job-stats';
import { PlanDraft } from './plan-draft';

export const aiPlanImportJobStatusValues = [
  'pending',
  'running',
  'done',
  'failed',
] as const;

export const AiPlanImportJobStatusEnum = createEnumObject(
  aiPlanImportJobStatusValues
);

export const aiPlanImportJobStatusSchema = z.enum(aiPlanImportJobStatusValues);

export type AiPlanImportJobStatus = z.infer<typeof aiPlanImportJobStatusSchema>;

export const aiPlanImportJobInFlightStatuses: AiPlanImportJobStatus[] = [
  AiPlanImportJobStatusEnum.PENDING,
  AiPlanImportJobStatusEnum.RUNNING,
];

export type AiPlanImportJobOptions = {
  instructions: string;
  planName: string;
  planType?: number;
  withVerifications: boolean;
  withSousActions: boolean;
  /** Plan PCAET : l'import propose les secteurs réglementaires des actions. */
  withSecteurs?: boolean;
  disabledFields: DisableableField[];
};

export type AiPlanImportJob = {
  id: string;
  collectiviteId: number;
  createdBy: string;
  status: AiPlanImportJobStatus;
  options: AiPlanImportJobOptions;
  stepStates: StepStates;
  sourcePath: string;
  draft: PlanDraft | null;
  error: string | null;
  createdPlanId: number | null;
  fichierId: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  stats: ImportJobStats | null;
  createdAt: string;
  modifiedAt: string;
};

/** Plan encore présent issu d'un import antérieur du même fichier. */
export type PreviousAiImport = {
  planId: number;
  planNom: string | null;
  planStatus: PlanStatus;
  importedAt: string;
};

export type AiPlanImportJobStatusView = {
  id: string;
  collectiviteId: number;
  status: AiPlanImportJobStatus;
  stepStates: StepStates;
  error: string | null;
  createdPlanId: number | null;
  qualitativeReview: string | null;
};
