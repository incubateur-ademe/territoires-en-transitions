import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['DOCUMENT_SCHEMA_MISMATCH'] as const;
type SpecificError = (typeof specificErrors)[number];

export const listDocumentsErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  commonErrors: {
    UNAUTHORIZED: {
      code: 'FORBIDDEN',
      message:
        "Vous n'avez pas les permissions nécessaires pour lister les documents de ce référentiel.",
    },
  },
  specificErrors: {
    DOCUMENT_SCHEMA_MISMATCH: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        "Un document ne respecte pas le format attendu et n'a pas pu être rendu.",
    },
  },
};

export const ListDocumentsErrorEnum = createErrorsEnum(specificErrors);
export type ListDocumentsError = keyof typeof ListDocumentsErrorEnum;
