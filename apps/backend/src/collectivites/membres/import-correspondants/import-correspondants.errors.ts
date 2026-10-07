import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'CSV_ILLISIBLE',
  'INITIATEUR_INCONNU',
  'TROP_D_ENVOIS',
] as const;

type SpecificError = (typeof specificErrors)[number];

export const importCorrespondantsErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      CSV_ILLISIBLE: {
        code: 'BAD_REQUEST',
        message: 'Le fichier de correspondants est illisible',
      },
      INITIATEUR_INCONNU: {
        code: 'BAD_REQUEST',
        message:
          "L'adresse de l'initiateur ne correspond à aucun compte de la plateforme",
      },
      TROP_D_ENVOIS: {
        code: 'BAD_REQUEST',
        message:
          "Ce passage dépasse le plafond d'envois : rien n'a été écrit",
      },
    },
  };

export const ImportCorrespondantsErrorEnum = createErrorsEnum(specificErrors);
export type ImportCorrespondantsError =
  keyof typeof ImportCorrespondantsErrorEnum;
