import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';

const PertinenceLeviersRepositoryErrors = [
  'LIST_PERTINENCES_ERROR',
  'UPSERT_PERTINENCE_ERROR',
] as const;

export const PertinenceLeviersRepositoryErrorEnum = createErrorsEnum(
  PertinenceLeviersRepositoryErrors
);

export type PertinenceLeviersRepositoryError =
  keyof typeof PertinenceLeviersRepositoryErrorEnum;
