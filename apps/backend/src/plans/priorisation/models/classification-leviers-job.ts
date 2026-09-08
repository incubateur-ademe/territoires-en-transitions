import { ClassifiedFiche } from '../pipeline/classify-fiches/apply-classification';
import { classificationLeviersJobTable } from './classification-leviers-job.table';

export const classificationLeviersJobStatusValues = [
  'pending',
  'running',
  'done',
  'failed',
] as const;

export type ClassificationLeviersJobStatus =
  (typeof classificationLeviersJobStatusValues)[number];

export const ClassificationLeviersJobStatusEnum = {
  PENDING: 'pending',
  RUNNING: 'running',
  DONE: 'done',
  FAILED: 'failed',
} as const satisfies Record<string, ClassificationLeviersJobStatus>;

export const classificationLeviersJobInFlightStatuses = [
  ClassificationLeviersJobStatusEnum.PENDING,
  ClassificationLeviersJobStatusEnum.RUNNING,
] as const;

export type UnclassifiedFiche = {
  ficheId: number;
  reason: string;
};

export type ClassificationDraft = {
  fiches: ClassifiedFiche[];
  unclassified: UnclassifiedFiche[];
};

export type ClassificationLeviersJob =
  typeof classificationLeviersJobTable.$inferSelect;
