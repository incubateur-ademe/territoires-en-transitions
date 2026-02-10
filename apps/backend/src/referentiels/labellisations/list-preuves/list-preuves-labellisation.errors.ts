import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'UNAUTHORIZED',
  'DEMANDE_NOT_FOUND',
  'DATABASE_ERROR',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const listPreuvesLabellisationErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      UNAUTHORIZED: {
        code: 'UNAUTHORIZED',
        message:
          "Vous n'avez pas les permissions nécessaires pour lister les preuves de cette demande.",
      },
      DEMANDE_NOT_FOUND: {
        code: 'BAD_REQUEST',
        message:
          'Aucune demande de labellisation trouvée pour cette collectivité et ce référentiel.',
      },
      DATABASE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          "Une erreur de base de données s'est produite lors de la récupération des preuves.",
      },
    },
  };

export const ListPreuvesLabellisationErrorEnum =
  createErrorsEnum(specificErrors);
export type ListPreuvesLabellisationError =
  keyof typeof ListPreuvesLabellisationErrorEnum;
