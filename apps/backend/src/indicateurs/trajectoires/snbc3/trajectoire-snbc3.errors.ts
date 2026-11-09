import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const trajectoireSnbc3SpecificErrors = [
  'TRAJECTOIRE_SNBC3_NON_OUVERTE',
  'COLLECTIVITE_NOT_FOUND',
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
    },
  };

export const TrajectoireSnbc3ErrorEnum = createErrorsEnum(
  trajectoireSnbc3SpecificErrors
);
export type TrajectoireSnbc3Error = keyof typeof TrajectoireSnbc3ErrorEnum;
