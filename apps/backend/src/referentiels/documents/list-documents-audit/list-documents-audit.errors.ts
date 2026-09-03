import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'UNAUTHORIZED',
  'AUDIT_NOT_FOUND',
  'DATABASE_ERROR',
  'DOCUMENT_SCHEMA_MISMATCH',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const listDocumentsAuditErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      UNAUTHORIZED: {
        code: 'UNAUTHORIZED',
        message:
          "Vous n'avez pas les permissions nécessaires pour lister les documents de cet audit.",
      },
      AUDIT_NOT_FOUND: {
        code: 'BAD_REQUEST',
        message:
          'Aucun audit trouvé pour cette collectivité et ce référentiel.',
      },
      DOCUMENT_SCHEMA_MISMATCH: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          "Un document ne respecte pas le format attendu et n'a pas pu être rendu.",
      },
      DATABASE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          "Une erreur de base de données s'est produite lors de la récupération des documents de cet audit.",
      },
    },
  };

export const ListDocumentsAuditErrorEnum = createErrorsEnum(specificErrors);
export type ListDocumentsAuditError = keyof typeof ListDocumentsAuditErrorEnum;
