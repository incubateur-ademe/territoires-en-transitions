import { getErrorCode } from '@tet/backend/utils/nest/errors.utils';
import { PgSyntaxErrorOrAccessRuleViolation } from '@tet/backend/utils/postgresql-error-codes.enum';

export const isRecetteNonConstruite = (error: unknown) =>
  getErrorCode(error) === PgSyntaxErrorOrAccessRuleViolation.UndefinedTable;
