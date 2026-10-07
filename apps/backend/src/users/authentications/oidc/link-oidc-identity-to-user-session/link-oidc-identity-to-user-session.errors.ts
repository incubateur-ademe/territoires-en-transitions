import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'TICKET_INVALIDE',
  'TICKET_EXPIRE',
  'IDENTITE_DEJA_LIEE_AILLEURS',
  'COMPTE_SUPPRIME',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const linkOidcIdentityToUserSessionErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      TICKET_INVALIDE: {
        code: 'BAD_REQUEST',
        message: 'Le ticket de liaison est invalide',
      },
      TICKET_EXPIRE: {
        code: 'BAD_REQUEST',
        message:
          'Le ticket de liaison a expiré, merci de recommencer la connexion',
      },
      IDENTITE_DEJA_LIEE_AILLEURS: {
        code: 'CONFLICT',
        message: 'Cette identité est déjà associée à un autre compte',
      },
      COMPTE_SUPPRIME: {
        code: 'FORBIDDEN',
        message: 'Ce compte a été supprimé',
      },
    },
  };

export const LinkOidcIdentityToUserSessionErrorEnum =
  createErrorsEnum(specificErrors);
export type LinkOidcIdentityToUserSessionError =
  keyof typeof LinkOidcIdentityToUserSessionErrorEnum;
