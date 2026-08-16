import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'DEMANDE_AVIS_NOT_FOUND',
  'DIAGNOSTIC_NON_FIGE',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const getDiagnosticInstructionErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      DEMANDE_AVIS_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "La demande d'avis n'a pas été trouvée",
      },
      DIAGNOSTIC_NON_FIGE: {
        code: 'CONFLICT',
        message:
          "Le diagnostic de ce dépôt n'a pas été figé à la transmission : il n'est pas consultable en instruction",
      },
    },
  };

export const GetDiagnosticInstructionErrorEnum =
  createErrorsEnum(specificErrors);
export type GetDiagnosticInstructionError =
  keyof typeof GetDiagnosticInstructionErrorEnum;
