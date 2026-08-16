import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'DEMANDE_AVIS_NOT_FOUND',
  'AVIS_NOT_FOUND',
  'AVIS_NON_VALIDE',
  'REFERENT_INTROUVABLE',
  'ENVOI_ECHEC',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const envoyerAvisErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    DEMANDE_AVIS_NOT_FOUND: {
      code: 'NOT_FOUND',
      message: "La demande d'avis n'a pas été trouvée",
    },
    AVIS_NOT_FOUND: {
      code: 'NOT_FOUND',
      message: "L'avis n'a pas été trouvé",
    },
    AVIS_NON_VALIDE: {
      code: 'CONFLICT',
      message: 'Seul un avis validé peut être envoyé au référent',
    },
    REFERENT_INTROUVABLE: {
      code: 'CONFLICT',
      message: "La collectivité n'a pas de référent à prévenir",
    },
    ENVOI_ECHEC: {
      code: 'INTERNAL_SERVER_ERROR',
      message: "L'envoi de l'email au référent a échoué",
    },
  },
};

export const EnvoyerAvisErrorEnum = createErrorsEnum(specificErrors);
export type EnvoyerAvisError = keyof typeof EnvoyerAvisErrorEnum;
