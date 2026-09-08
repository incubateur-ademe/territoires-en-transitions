import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';

export const FicheLeviersSpecificErrors = ['SAVE_LEVIERS_ERROR'] as const;

export type FicheLeviersSpecificError =
  (typeof FicheLeviersSpecificErrors)[number];

export const FicheLeviersErrorEnum = createErrorsEnum(
  FicheLeviersSpecificErrors
);

export type FicheLeviersError = keyof typeof FicheLeviersErrorEnum;
