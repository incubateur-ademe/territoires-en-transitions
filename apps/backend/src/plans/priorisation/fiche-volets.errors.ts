import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';

export const FicheVoletsSpecificErrors = ['SAVE_VOLETS_ERROR'] as const;

export type FicheVoletsSpecificError =
  (typeof FicheVoletsSpecificErrors)[number];

export const FicheVoletsErrorEnum = createErrorsEnum(FicheVoletsSpecificErrors);

export type FicheVoletsError = keyof typeof FicheVoletsErrorEnum;
