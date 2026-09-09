import {
  createErrorsEnum,
  type TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'DEMARCHE_PCAET_NOT_FOUND',
  'DIAGNOSTIC_NON_MODIFIABLE',
  'INDICATEUR_NON_ANNUEL',
] as const;

type SpecificError = (typeof specificErrors)[number];

export const updateDiagnosticIndicateursValeursErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      INDICATEUR_NON_ANNUEL: {
        code: 'BAD_REQUEST',
        message:
          'Le diagnostic PCAET exige des indicateurs annuels du référentiel',
      },
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

export const UpdateDiagnosticIndicateursValeursErrorEnum =
  createErrorsEnum(specificErrors);

export type UpdateDiagnosticIndicateursValeursError =
  keyof typeof UpdateDiagnosticIndicateursValeursErrorEnum;
