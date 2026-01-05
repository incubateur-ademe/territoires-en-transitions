import { createEnumObject } from '@tet/domain/utils';

export const reportGenerationStatusValues = [
  'pending',
  'processing',
  'completed',
  'failed',
] as const;

export type ReportGenerationStatus =
  (typeof reportGenerationStatusValues)[number];

export const ReportGenerationStatusEnum = createEnumObject(
  reportGenerationStatusValues
);
