import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['PREUVE_FICHIER'] as const;
type SpecificError = (typeof specificErrors)[number];

export const editPreuveDocumentErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      PREUVE_FICHIER: {
        code: 'BAD_REQUEST',
        message:
          "Cette preuve est un fichier : le lien ne peut pas être modifié via cette opération.",
      },
    },
  };

export const EditPreuveDocumentErrorEnum = createErrorsEnum(specificErrors);
export type EditPreuveDocumentError = keyof typeof EditPreuveDocumentErrorEnum;
