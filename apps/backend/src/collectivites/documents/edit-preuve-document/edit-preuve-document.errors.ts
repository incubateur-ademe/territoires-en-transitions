import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['PREUVE_FICHIER', 'LABELLISATION_EN_COURS'] as const;
type SpecificError = (typeof specificErrors)[number];

export const editPreuveDocumentErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      PREUVE_FICHIER: {
        code: 'BAD_REQUEST',
        message:
          "Cette preuve est un fichier : le lien ne peut pas être modifié via cette opération.",
      },
      LABELLISATION_EN_COURS: {
        code: 'BAD_REQUEST',
        message:
          "Les documents de candidature ne peuvent plus être modifiés une fois l'audit clôturé et la labellisation en cours.",
      },
    },
  };

export const EditPreuveDocumentErrorEnum = createErrorsEnum(specificErrors);
export type EditPreuveDocumentError = keyof typeof EditPreuveDocumentErrorEnum;
