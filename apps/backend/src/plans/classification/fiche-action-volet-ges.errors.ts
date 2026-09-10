import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';

export const FicheActionVoletGesSpecificErrors = ['SAVE_VOLETS_ERROR'] as const;

export type FicheActionVoletGesSpecificError =
  (typeof FicheActionVoletGesSpecificErrors)[number];

export const FicheActionVoletGesErrorEnum = createErrorsEnum(
  FicheActionVoletGesSpecificErrors
);

export type FicheActionVoletGesError = keyof typeof FicheActionVoletGesErrorEnum;
