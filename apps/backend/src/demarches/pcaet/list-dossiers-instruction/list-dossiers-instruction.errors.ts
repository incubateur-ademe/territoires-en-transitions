import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['LIST_DOSSIERS_INSTRUCTION_ERROR'] as const;
type SpecificError = (typeof specificErrors)[number];

export const listDossiersInstructionErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      LIST_DOSSIERS_INSTRUCTION_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur de lecture des dossiers à instruire',
      },
    },
  };

export const ListDossiersInstructionErrorEnum =
  createErrorsEnum(specificErrors);
export type ListDossiersInstructionError =
  keyof typeof ListDossiersInstructionErrorEnum;
