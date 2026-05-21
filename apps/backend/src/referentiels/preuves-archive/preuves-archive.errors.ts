import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';

export const PreuvesArchiveSpecificErrors = [
  'CREATE_ARCHIVE_ERROR',
  'GET_ARCHIVE_ERROR',
  'UPDATE_ARCHIVE_ERROR',
  'ARCHIVE_NOT_FOUND',
  'AUDIT_NOT_FOUND',
  'ARCHIVE_STATUS_PARSE_ERROR',
  'COLLECT_PREUVES_ERROR',
] as const;

export type PreuvesArchiveSpecificError =
  (typeof PreuvesArchiveSpecificErrors)[number];

export const PreuvesArchiveErrorEnum = createErrorsEnum(
  PreuvesArchiveSpecificErrors
);
export type PreuvesArchiveError = keyof typeof PreuvesArchiveErrorEnum;
