import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'COLLECTIVITE_NOT_EPCI',
  'TRAJECTOIRE_NOT_COMPUTED',
  'TRAJECTOIRE_SOURCES_NOT_EXTRACTABLE',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const trajectoireLeviersErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      COLLECTIVITE_NOT_EPCI: {
        code: 'BAD_REQUEST',
        message:
          'La collectivité doit être un EPCI pour récupérer les données de trajectoire leviers',
      },
      TRAJECTOIRE_NOT_COMPUTED: {
        code: 'NOT_FOUND',
        message: "La trajectoire SNBC de la collectivité n'a pas été calculée",
      },
      TRAJECTOIRE_SOURCES_NOT_EXTRACTABLE: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          "Impossible d'extraire les sources de données utilisées pour calculer la trajectoire de la collectivité",
      },
    },
  };

export const TrajectoireLeviersErrorEnum = createErrorsEnum(specificErrors);
export type TrajectoireLeviersError = keyof typeof TrajectoireLeviersErrorEnum;
