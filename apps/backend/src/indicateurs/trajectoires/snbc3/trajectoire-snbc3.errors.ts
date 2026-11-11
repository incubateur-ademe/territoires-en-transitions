import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const trajectoireSnbc3SpecificErrors = [
  'TRAJECTOIRE_SNBC3_NON_OUVERTE',
  'COLLECTIVITE_NOT_FOUND',
  'METHODOLOGIE_SNBC3_INDISPONIBLE',
  'TRAJECTOIRE_NON_DISPONIBLE',
  'WORKBOOK_NOT_FOUND',
  'WORKBOOK_INVALID',
  'TERRITOIRE_NOT_IN_WORKBOOK',
  'SNBC3_IMPORT_UNFINISHED',
] as const;

type TrajectoireSnbc3SpecificError =
  (typeof trajectoireSnbc3SpecificErrors)[number];

export const trajectoireSnbc3ErrorConfig: TrpcErrorHandlerConfig<TrajectoireSnbc3SpecificError> =
  {
    specificErrors: {
      TRAJECTOIRE_SNBC3_NON_OUVERTE: {
        code: 'FORBIDDEN',
        message:
          "La trajectoire SNBC 3 n'est pas encore ouverte pour cet utilisateur ou cette collectivité",
      },
      COLLECTIVITE_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: 'Collectivité introuvable',
      },
      METHODOLOGIE_SNBC3_INDISPONIBLE: {
        code: 'NOT_FOUND',
        message:
          "La méthodologie de la trajectoire SNBC 3 n'a pas encore été importée",
      },
      TRAJECTOIRE_NON_DISPONIBLE: {
        code: 'UNPROCESSABLE_CONTENT',
        message:
          "La trajectoire SNBC 3 n'est pas disponible pour cette collectivité",
      },
      WORKBOOK_NOT_FOUND: {
        code: 'NOT_FOUND',
        message:
          "L'outil Excel de la trajectoire SNBC 3 n'a pas encore été importé",
      },
      WORKBOOK_INVALID: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          "L'outil Excel de la trajectoire SNBC 3 n'a pas pu être adapté à la collectivité",
      },
      // Parquet et classeur désynchronisés : on ne sert jamais un classeur non
      // adapté sans le dire.
      TERRITOIRE_NOT_IN_WORKBOOK: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          "La collectivité est absente de l'outil Excel de la trajectoire SNBC 3",
      },
      // Valeurs et classeur peuvent venir de deux releases : on ne sert pas un
      // classeur qui ne correspond pas à la page.
      SNBC3_IMPORT_UNFINISHED: {
        code: 'SERVICE_UNAVAILABLE',
        message:
          'La trajectoire SNBC 3 est en cours de mise à jour, réessayez plus tard',
      },
    },
  };

export const TrajectoireSnbc3ErrorEnum = createErrorsEnum(
  trajectoireSnbc3SpecificErrors
);
export type TrajectoireSnbc3Error = keyof typeof TrajectoireSnbc3ErrorEnum;
