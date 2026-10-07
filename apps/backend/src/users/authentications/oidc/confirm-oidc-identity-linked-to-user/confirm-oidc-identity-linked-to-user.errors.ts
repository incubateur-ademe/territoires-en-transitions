import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'TOKEN_INVALIDE',
  'TOKEN_EXPIRE',
  'IDENTITE_DEJA_LIEE_AILLEURS',
  'COMPTE_SUPPRIME',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const confirmOidcIdentityLinkedToUserErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      TOKEN_INVALIDE: {
        code: 'BAD_REQUEST',
        message: 'Ce lien de confirmation est invalide ou a déjà été utilisé',
      },
      TOKEN_EXPIRE: {
        code: 'BAD_REQUEST',
        message:
          'Ce lien de confirmation a expiré, merci de recommencer la demande',
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

export const ConfirmOidcIdentityLinkedToUserErrorEnum =
  createErrorsEnum(specificErrors);
export type ConfirmOidcIdentityLinkedToUserError =
  keyof typeof ConfirmOidcIdentityLinkedToUserErrorEnum;
