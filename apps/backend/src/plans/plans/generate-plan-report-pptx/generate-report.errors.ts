export const GenerateReportErrorType = {
  PLAN_NOT_FOUND: 'PLAN_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
} as const;

export type GenerateReportErrorType =
  (typeof GenerateReportErrorType)[keyof typeof GenerateReportErrorType];
