import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { createEnumObject } from '@tet/domain/utils';
import { ClassificationDraft } from './classification-draft';

export const classificationLeviersJobStatusValues = [
  'pending',
  'running',
  'done',
  'failed',
] as const;

export type ClassificationLeviersJobStatus =
  (typeof classificationLeviersJobStatusValues)[number];

export const ClassificationLeviersJobStatusEnum = createEnumObject(
  classificationLeviersJobStatusValues
);

export const classificationLeviersJobInFlightStatuses: ClassificationLeviersJobStatus[] =
  [
    ClassificationLeviersJobStatusEnum.PENDING,
    ClassificationLeviersJobStatusEnum.RUNNING,
  ];

export const CLASSIFICATION_DEADLINE_MS = 30 * 60 * 1000;

export const IN_FLIGHT_LEASE_MARGIN_MS = 5 * 60 * 1000;

export const IN_FLIGHT_LEASE_MS =
  CLASSIFICATION_DEADLINE_MS + IN_FLIGHT_LEASE_MARGIN_MS;

export type ClassificationLeviersJob = {
  id: string;
  collectiviteId: number;
  planId: number;
  createdBy: string;
  status: ClassificationLeviersJobStatus;
  processedBatches: number;
  totalBatches: number;
  draft: ClassificationDraft | null;
  tokenUsage: TokenUsage | null;
  error: string | null;
  createdAt: string;
  modifiedAt: string;
};
