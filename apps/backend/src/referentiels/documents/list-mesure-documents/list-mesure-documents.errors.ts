import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'DOCUMENT_SCHEMA_MISMATCH',
  'UNKNOWN_REFERENTIEL',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const listMesureDocumentsErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    commonErrors: {
      UNAUTHORIZED: {
        code: 'FORBIDDEN',
        message:
          "Vous n'avez pas les permissions nécessaires pour lister les documents de cette mesure.",
      },
    },
    specificErrors: {
      DOCUMENT_SCHEMA_MISMATCH: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          "Un document ne respecte pas le format attendu et n'a pas pu être rendu.",
      },
      UNKNOWN_REFERENTIEL: {
        code: 'BAD_REQUEST',
        message: "L'identifiant de mesure ne désigne aucun référentiel connu.",
      },
    },
  };

export const ListMesureDocumentsErrorEnum = createErrorsEnum(specificErrors);
export type ListMesureDocumentsError =
  keyof typeof ListMesureDocumentsErrorEnum;
