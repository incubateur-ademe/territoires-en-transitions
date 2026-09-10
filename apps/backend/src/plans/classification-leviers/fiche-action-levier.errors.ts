import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';

export const FicheActionLevierSpecificErrors = ['SAVE_LEVIERS_ERROR'] as const;

export type FicheActionLevierSpecificError =
  (typeof FicheActionLevierSpecificErrors)[number];

export const FicheActionLevierErrorEnum = createErrorsEnum(
  FicheActionLevierSpecificErrors
);

export type FicheActionLevierError = keyof typeof FicheActionLevierErrorEnum;
