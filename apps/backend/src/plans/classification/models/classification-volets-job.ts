import { Enjeu, AnalysisStep } from '@tet/domain/shared';
import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { createEnumObject } from '@tet/domain/utils';
import { ClassificationDraft } from './classification-draft';

export const classificationVoletsJobStatusValues = [
  'pending',
  'running',
  'done',
  'failed',
] as const;

export type ClassificationVoletsJobStatus =
  (typeof classificationVoletsJobStatusValues)[number];

export const ClassificationVoletsJobStatusEnum = createEnumObject(
  classificationVoletsJobStatusValues
);

export const classificationVoletsJobInFlightStatuses: ClassificationVoletsJobStatus[] =
  [
    ClassificationVoletsJobStatusEnum.PENDING,
    ClassificationVoletsJobStatusEnum.RUNNING,
  ];

export const CLASSIFICATION_DEADLINE_MS = 30 * 60 * 1000;

export const IN_FLIGHT_LEASE_MARGIN_MS = 5 * 60 * 1000;

export const IN_FLIGHT_LEASE_MS =
  CLASSIFICATION_DEADLINE_MS + IN_FLIGHT_LEASE_MARGIN_MS;

export const FICHES_TO_CLASSIFY_FILTERS = {
  noPlan: false,
  restreint: false,
} as const;

export type ClassificationVoletsJob = {
  id: string;
  collectiviteId: number;
  enjeu: Enjeu;
  etape: AnalysisStep;
  createdBy: string;
  status: ClassificationVoletsJobStatus;
  processedBatches: number;
  totalBatches: number;
  draft: ClassificationDraft | null;
  tokenUsage: TokenUsage | null;
  error: string | null;
  createdAt: string;
  modifiedAt: string;
};
