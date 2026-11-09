import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'COLLECTIVITE_NOT_EPCI',
  'TRAJECTOIRE_NOT_COMPUTED',
  'TRAJECTOIRE_SOURCES_NOT_EXTRACTABLE',
  'TRAJECTOIRE_NON_DISPONIBLE',
  'REGION_NON_SUPPORTEE',
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
      TRAJECTOIRE_NON_DISPONIBLE: {
        code: 'NOT_FOUND',
        message:
          "La trajectoire SNBC 3 n'est pas disponible pour cette collectivité",
      },
      REGION_NON_SUPPORTEE: {
        code: 'BAD_REQUEST',
        message:
          "Les leviers SGPE ne sont pas disponibles pour les collectivités hors de l'Hexagone",
      },
    },
  };

export const TrajectoireLeviersErrorEnum = createErrorsEnum(specificErrors);
export type TrajectoireLeviersError = keyof typeof TrajectoireLeviersErrorEnum;
