import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

export const UpdateDocumentSpecificErrors = [
  'DOCUMENT_NOT_FOUND',
  'NO_CHANGES_TO_MAKE',
] as const;
type UpdateDocumentSpecificError =
  (typeof UpdateDocumentSpecificErrors)[number];

export const updateDocumentErrorConfig: TrpcErrorHandlerConfig<UpdateDocumentSpecificError> =
  {
    specificErrors: {
      DOCUMENT_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: 'Document non trouvé pour cette collectivité',
      },
      NO_CHANGES_TO_MAKE: {
        code: 'BAD_REQUEST',
        message: 'Aucune modification à appliquer pour le document',
      },
    },
  };

export const UpdateDocumentErrorEnum = createErrorsEnum(
  UpdateDocumentSpecificErrors
);
export type UpdateDocumentError = keyof typeof UpdateDocumentErrorEnum;
