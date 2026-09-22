import { Enjeu, AnalysisStep } from '@tet/domain/shared';
import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { createEnumObject } from '@tet/domain/utils';
import { ClassificationDraft } from './classification-draft';

export const analysisJobStatusValues = [
  'pending',
  'running',
  'done',
  'failed',
] as const;

export type AnalysisJobStatus = (typeof analysisJobStatusValues)[number];

export const AnalysisJobStatusEnum = createEnumObject(analysisJobStatusValues);

export const analysisJobInFlightStatuses: AnalysisJobStatus[] = [
  AnalysisJobStatusEnum.PENDING,
  AnalysisJobStatusEnum.RUNNING,
];

export const CLASSIFICATION_BUDGET_MS = 30 * 60 * 1000;

export const MOBILISATION_BUDGET_MS = 30 * 60 * 1000;

export const ANALYSIS_BUDGET_MS =
  CLASSIFICATION_BUDGET_MS + MOBILISATION_BUDGET_MS;

export const IN_FLIGHT_LEASE_MARGIN_MS = 5 * 60 * 1000;

export const IN_FLIGHT_LEASE_MS =
  ANALYSIS_BUDGET_MS + IN_FLIGHT_LEASE_MARGIN_MS;

export const toClassificationDeadlineFrom = (createdAt: string): string =>
  new Date(Date.parse(createdAt) + CLASSIFICATION_BUDGET_MS).toISOString();

export const toAnalysisDeadlineFrom = (createdAt: string): string =>
  new Date(Date.parse(createdAt) + ANALYSIS_BUDGET_MS).toISOString();

export const toDeadlineSignal = (
  deadlineAt: string | undefined
): AbortSignal => {
  const remainingMs = deadlineAt
    ? Date.parse(deadlineAt) - Date.now()
    : Number.NaN;

  return AbortSignal.timeout(
    Number.isNaN(remainingMs)
      ? CLASSIFICATION_BUDGET_MS
      : Math.max(0, remainingMs)
  );
};

export const FICHES_TO_CLASSIFY_FILTERS = {
  noPlan: false,
  restreint: false,
} as const;

export type AnalysisJob = {
  id: string;
  collectiviteId: number;
  enjeu: Enjeu;
  etape: AnalysisStep;
  createdBy: string;
  status: AnalysisJobStatus;
  processedBatches: number;
  totalBatches: number;
  draft: ClassificationDraft | null;
  tokenUsage: TokenUsage | null;
  error: string | null;
  createdAt: string;
  modifiedAt: string;
};
