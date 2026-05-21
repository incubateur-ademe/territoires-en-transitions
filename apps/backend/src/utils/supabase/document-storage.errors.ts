import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';

export const DocumentStorageSpecificErrors = [
  'READ_DOCUMENT_ERROR',
  'WRITE_DOCUMENT_ERROR',
] as const;

export type DocumentStorageSpecificError =
  (typeof DocumentStorageSpecificErrors)[number];

export const DocumentStorageErrorEnum = createErrorsEnum(
  DocumentStorageSpecificErrors
);
export type DocumentStorageError = keyof typeof DocumentStorageErrorEnum;
