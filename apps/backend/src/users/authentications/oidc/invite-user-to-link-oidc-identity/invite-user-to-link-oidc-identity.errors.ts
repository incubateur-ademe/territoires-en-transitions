import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['TICKET_INVALIDE', 'TICKET_EXPIRE'] as const;
type SpecificError = (typeof specificErrors)[number];

export const inviteUserToLinkOidcIdentityErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      TICKET_INVALIDE: {
        code: 'BAD_REQUEST',
        message: 'Le ticket de connexion est invalide',
      },
      TICKET_EXPIRE: {
        code: 'BAD_REQUEST',
        message:
          'Le ticket de connexion a expiré, merci de recommencer la connexion ProConnect',
      },
    },
  };

export const InviteUserToLinkOidcIdentityErrorEnum =
  createErrorsEnum(specificErrors);
export type InviteUserToLinkOidcIdentityError =
  keyof typeof InviteUserToLinkOidcIdentityErrorEnum;
