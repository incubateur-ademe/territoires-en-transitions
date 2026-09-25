import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['SEND_CONTACT_EMAIL_ERROR'] as const;
type SpecificError = (typeof specificErrors)[number];

export const sendContactMessageErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      SEND_CONTACT_EMAIL_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "Une erreur est survenue lors de l'envoi de votre message",
      },
    },
  };

export const SendContactMessageErrorEnum = createErrorsEnum(specificErrors);
export type SendContactMessageError = keyof typeof SendContactMessageErrorEnum;
