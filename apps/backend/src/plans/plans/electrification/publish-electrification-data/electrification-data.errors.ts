import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'DATA_UNAVAILABLE',
  'INVALID_DATA',
  'VERSION_ALREADY_EXISTS',
  'STORAGE_ERROR',
  'SOURCE_UNAVAILABLE',
  'SOURCE_NOT_CONFIGURED',
  'SOURCE_CHANGED',
  'INVALID_SOURCE',
] as const;

export const electrificationDataErrorConfig: TrpcErrorHandlerConfig<
  (typeof specificErrors)[number]
> = {
  specificErrors: {
    SOURCE_NOT_CONFIGURED: {
      code: 'PRECONDITION_FAILED',
      message:
        'La source Grist n’est pas configurée. Publiez les liens des références externes pour le catalogue, ou configurez le document des lauréats.',
    },
    SOURCE_UNAVAILABLE: {
      code: 'PRECONDITION_FAILED',
      message:
        'La source métier est inaccessible ou son format a changé. Vérifiez les accès et les colonnes attendues.',
    },
    SOURCE_CHANGED: {
      code: 'CONFLICT',
      message:
        'Le document Grist a été modifié pendant sa lecture. Relancez la préparation.',
    },
    INVALID_SOURCE: {
      code: 'BAD_REQUEST',
      message:
        'La source métier est incomplète ou contient des liens Grist ou des rattachements incohérents. Aucune version n’a été publiée.',
    },
    DATA_UNAVAILABLE: {
      code: 'PRECONDITION_FAILED',
      message: 'La version des données Électrification est indisponible.',
    },
    INVALID_DATA: {
      code: 'BAD_REQUEST',
      message:
        'Les données Électrification sont invalides. Vérifiez les erreurs avant publication.',
    },
    VERSION_ALREADY_EXISTS: {
      code: 'CONFLICT',
      message:
        'Cette version existe déjà avec un contenu différent. Utilisez une nouvelle version.',
    },
    STORAGE_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        'Les données Électrification ne peuvent pas être enregistrées ou chargées.',
    },
  },
};

export const ElectrificationDataErrorEnum = createErrorsEnum(specificErrors);
export type ElectrificationDataError =
  keyof typeof ElectrificationDataErrorEnum;
