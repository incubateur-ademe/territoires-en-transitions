import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['DEMARCHE_PCAET_NOT_FOUND'] as const;
type SpecificError = (typeof specificErrors)[number];

export const getDiagnosticErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    DEMARCHE_PCAET_NOT_FOUND: {
      code: 'NOT_FOUND',
      message: "La démarche PCAET demandée n'a pas été trouvée",
    },
  },
};

export const GetDiagnosticErrorEnum = createErrorsEnum(specificErrors);
export type GetDiagnosticError = keyof typeof GetDiagnosticErrorEnum;
