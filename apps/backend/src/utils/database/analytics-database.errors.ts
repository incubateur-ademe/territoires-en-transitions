import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';

export const analyticsDatabaseErrors = [
  'ANALYTICS_DATABASE_NOT_CONFIGURED',
  'ANALYTICS_QUERY_ERROR',
  'ANALYTICS_QUERY_TIMEOUT',
  'ANALYTICS_QUERY_READ_ONLY_VIOLATION',
] as const;

export const AnalyticsDatabaseErrorEnum = createErrorsEnum(
  analyticsDatabaseErrors
);
export type AnalyticsDatabaseError = keyof typeof AnalyticsDatabaseErrorEnum;
