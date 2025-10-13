// ============================================================================
// ERROR HANDLING
// ============================================================================

export const DiscussionErrorEnum = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  FILTERS_NOT_VALID: 'FILTERS_NOT_VALID',
  OPTIONS_NOT_VALID: 'OPTIONS_NOT_VALID',
  BAD_REQUEST: 'BAD_REQUEST',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NOT_FOUND: 'NOT_FOUND',
} as const;

export type DiscussionError =
  (typeof DiscussionErrorEnum)[keyof typeof DiscussionErrorEnum];
