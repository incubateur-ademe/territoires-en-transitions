import { IndicateurValeursFailure } from '@tet/backend/indicateurs/valeurs/indicateur-valeurs.errors';
import { failure, Result } from '@tet/backend/utils/result.type';
import {
  createErrorsEnum,
  type TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'DEMARCHE_PCAET_NOT_FOUND',
  'DIAGNOSTIC_NON_MODIFIABLE',
  'INDICATEUR_NON_ANNUEL',
  'INVALID_VALUE',
  'INDICATEUR_NOT_AVAILABLE',
  'PERIODICITE_MISMATCH',
  'USER_VALUE_NOT_ALLOWED',
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
      INVALID_VALUE: { code: 'BAD_REQUEST', messageFromCause: true },
      INDICATEUR_NOT_AVAILABLE: { code: 'BAD_REQUEST', messageFromCause: true },
      PERIODICITE_MISMATCH: { code: 'BAD_REQUEST', messageFromCause: true },
      USER_VALUE_NOT_ALLOWED: { code: 'BAD_REQUEST', messageFromCause: true },
      DEMARCHE_PCAET_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "La démarche PCAET demandée n'a pas été trouvée",
      },
      DIAGNOSTIC_NON_MODIFIABLE: {
        code: 'CONFLICT',
        message:
          "Le diagnostic n'est modifiable que pendant l'élaboration du dépôt et après les avis, jusqu'à la publication",
      },
    },
  };

export const UpdateDiagnosticIndicateursValeursErrorEnum =
  createErrorsEnum(specificErrors);

export type UpdateDiagnosticIndicateursValeursError =
  keyof typeof UpdateDiagnosticIndicateursValeursErrorEnum;

export const toUpdateDiagnosticFailure = ({
  error,
  cause,
}: IndicateurValeursFailure): Result<
  never,
  UpdateDiagnosticIndicateursValeursError
> => failure(error, cause);
