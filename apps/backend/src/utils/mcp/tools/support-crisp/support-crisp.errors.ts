import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'CRISP_NOT_CONFIGURED',
  'CRISP_API_ERROR',
  'INVALID_DATE_RANGE',
  'FILTER_REQUIRED',
  'TOO_MANY_CONVERSATIONS',
  'INVALID_TOKEN',
  'EXPIRED_TOKEN',
] as const;

export const SupportCrispErrorEnum = createErrorsEnum(specificErrors);

export const supportCrispErrorConfig: TrpcErrorHandlerConfig<
  (typeof specificErrors)[number]
> = {
  specificErrors: {
    CRISP_NOT_CONFIGURED: {
      code: 'PRECONDITION_FAILED',
      message: "Crisp n'est pas configuré sur ce serveur.",
    },
    CRISP_API_ERROR: {
      code: 'BAD_GATEWAY',
      message: "Crisp a refusé ou n'a pas répondu.",
    },
    INVALID_DATE_RANGE: { code: 'BAD_REQUEST', message: 'Période invalide.' },
    FILTER_REQUIRED: { code: 'BAD_REQUEST', message: 'Filtre requis.' },
    TOO_MANY_CONVERSATIONS: {
      code: 'BAD_REQUEST',
      message: 'Trop de conversations.',
    },
    INVALID_TOKEN: {
      code: 'BAD_REQUEST',
      message: "Cette action n'est pas valide.",
    },
    EXPIRED_TOKEN: {
      code: 'BAD_REQUEST',
      message: "Cette action a expiré : redemandez-la à l'assistant.",
    },
  },
};
export type SupportCrispError = keyof typeof SupportCrispErrorEnum;
