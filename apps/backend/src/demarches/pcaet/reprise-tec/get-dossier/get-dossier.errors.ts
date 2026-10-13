import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['RECETTE_NON_CONSTRUITE'] as const;
type SpecificError = (typeof specificErrors)[number];

export const getDossierErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    RECETTE_NON_CONSTRUITE: {
      code: 'PRECONDITION_FAILED',
      message: "La recette de la reprise T&C n'est pas encore construite",
    },
  },
};

export const GetDossierErrorEnum = createErrorsEnum(specificErrors);
export type GetDossierError = keyof typeof GetDossierErrorEnum;
