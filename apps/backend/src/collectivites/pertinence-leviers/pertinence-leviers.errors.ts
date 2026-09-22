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

const PertinenceLeviersSpecificErrors = [
  ...PertinenceLeviersRepositoryErrors,
  'COLLECTIVITE_NOT_FOUND',
] as const;

export type PertinenceLeviersSpecificError =
  (typeof PertinenceLeviersSpecificErrors)[number];

export const PertinenceLeviersErrorEnum = createErrorsEnum(
  PertinenceLeviersSpecificErrors
);

export type PertinenceLeviersError = keyof typeof PertinenceLeviersErrorEnum;
