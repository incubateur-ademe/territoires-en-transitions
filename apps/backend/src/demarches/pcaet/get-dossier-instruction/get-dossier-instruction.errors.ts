import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['DEMANDE_AVIS_NOT_FOUND'] as const;
type SpecificError = (typeof specificErrors)[number];

export const getDossierInstructionErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      DEMANDE_AVIS_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "La demande d'avis n'a pas été trouvée",
      },
    },
  };

export const GetDossierInstructionErrorEnum = createErrorsEnum(specificErrors);
export type GetDossierInstructionError =
  keyof typeof GetDossierInstructionErrorEnum;
