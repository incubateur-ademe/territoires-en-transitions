import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'POSTHOG_NOT_CONFIGURED',
  'POSTHOG_QUERY_ERROR',
  'INVALID_DATE_RANGE',
  'INTERNAL_USERS_UNAVAILABLE',
] as const;

export const RunHogqlQueryErrorEnum = createErrorsEnum(specificErrors);
export type RunHogqlQueryError = keyof typeof RunHogqlQueryErrorEnum;
