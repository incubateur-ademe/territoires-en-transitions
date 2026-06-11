import { createEnumObject } from '@tet/domain/utils';
import { z } from 'zod';
import { StepStates } from '../generate-import-draft/run-import-pipeline';
import { DisableableField } from './disableable-field';
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
  withVerifications: boolean;
  withSousActions: boolean;
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
  confirmedPlanId: number | null;
  createdAt: string;
  modifiedAt: string;
};
