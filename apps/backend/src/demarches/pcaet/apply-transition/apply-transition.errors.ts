import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'DEMARCHE_PCAET_NOT_FOUND',
  'TRANSITION_NOT_ALLOWED',
  'GUARD_NOT_SATISFIED',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const applyTransitionErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      DEMARCHE_PCAET_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "La démarche PCAET demandée n'a pas été trouvée",
      },
      TRANSITION_NOT_ALLOWED: {
        code: 'CONFLICT',
        message:
          'Cette transition n’est pas permise depuis le statut actuel de la démarche',
      },
      GUARD_NOT_SATISFIED: {
        code: 'PRECONDITION_FAILED',
        message:
          'Les conditions requises pour cette transition ne sont pas remplies',
      },
    },
  };

export const ApplyTransitionErrorEnum = createErrorsEnum(specificErrors);
export type ApplyTransitionError = keyof typeof ApplyTransitionErrorEnum;
