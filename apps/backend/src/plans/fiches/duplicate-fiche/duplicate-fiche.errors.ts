import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['FICHE_NOT_FOUND', 'DUPLICATE_FICHE_ERROR'] as const;
type SpecificError = (typeof specificErrors)[number];

export const duplicateFicheErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    FICHE_NOT_FOUND: {
      code: 'NOT_FOUND',
      message: "La fiche à dupliquer n'a pas été trouvée",
    },
    DUPLICATE_FICHE_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Une erreur est survenue lors de la duplication de la fiche',
    },
  },
};

export const DuplicateFicheErrorEnum = createErrorsEnum(specificErrors);
export type DuplicateFicheError = keyof typeof DuplicateFicheErrorEnum;
