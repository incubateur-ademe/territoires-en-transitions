import {
  createErrorsEnum,
  type TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'DEMARCHE_PCAET_NOT_FOUND',
  'DIAGNOSTIC_NON_MODIFIABLE',
] as const;

type SpecificError = (typeof specificErrors)[number];

export const updateDiagnosticIndicateursValeursErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      DEMARCHE_PCAET_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "La démarche PCAET demandée n'a pas été trouvée",
      },
      DIAGNOSTIC_NON_MODIFIABLE: {
        code: 'CONFLICT',
        message:
          "Le diagnostic n'est modifiable que pendant l'élaboration du dépôt",
      },
    },
  };

export const UpdateDiagnosticIndicateursValeursErrorEnum = createErrorsEnum(
  specificErrors
);

export type UpdateDiagnosticIndicateursValeursError =
  keyof typeof UpdateDiagnosticIndicateursValeursErrorEnum;

