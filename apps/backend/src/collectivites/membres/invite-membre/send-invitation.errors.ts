import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'INVITATION_NOT_PENDING',
  'INCOMPLETE_SENDER_PROFILE',
  'SEND_EMAIL_ERROR',
  'COLLECTIVITE_NOT_FOUND',
] as const;

type SpecificError = (typeof specificErrors)[number];

export const sendInvitationErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      INVITATION_NOT_PENDING: {
        code: 'BAD_REQUEST',
        message: "Cette invitation n'est plus en attente",
      },
      INCOMPLETE_SENDER_PROFILE: {
        code: 'FORBIDDEN',
        message: "Profil de l'expéditeur incomplet",
      },
      SEND_EMAIL_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "L'invitation n'a pas pu être envoyée par email",
      },
      COLLECTIVITE_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Cette collectivité n'existe pas",
      },
    },
  };

export const SendInvitationErrorEnum = createErrorsEnum(specificErrors);
export type SendInvitationError = keyof typeof SendInvitationErrorEnum;
