import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';
import { analyticsDatabaseErrors } from '@tet/backend/utils/database/analytics-database.errors';

const specificErrors = ['INVALID_SQL', ...analyticsDatabaseErrors] as const;

export const RunSqlQueryErrorEnum = createErrorsEnum(specificErrors);
export type RunSqlQueryError = keyof typeof RunSqlQueryErrorEnum;
