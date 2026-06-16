import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'UNAUTHORIZED',
  'DEMANDE_NOT_FOUND',
  'LABELLISATION_IN_PROGRESS',
  'DATABASE_ERROR',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const createLabellisationPreuveErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      UNAUTHORIZED: {
        code: 'UNAUTHORIZED',
        message:
          "Vous n'avez pas les permissions nécessaires pour ajouter une preuve à cette demande.",
      },
      DEMANDE_NOT_FOUND: {
        code: 'BAD_REQUEST',
        message:
          'Aucune demande de labellisation trouvée pour cette collectivité et ce référentiel.',
      },
      LABELLISATION_IN_PROGRESS: {
        code: 'BAD_REQUEST',
        message:
          "Les documents de candidature ne peuvent plus être modifiés une fois l'audit clôturé et la labellisation en cours.",
      },
      DATABASE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          "Une erreur de base de données s'est produite lors de l'ajout de la preuve.",
      },
    },
  };

export const CreateLabellisationPreuveErrorEnum =
  createErrorsEnum(specificErrors);
export type CreateLabellisationPreuveError =
  keyof typeof CreateLabellisationPreuveErrorEnum;
