import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['DELIAISON_REFUSEE_DERNIER_MOYEN_CONNEXION'] as const;
type SpecificError = (typeof specificErrors)[number];

export const handleUserOidcIdentitiesErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      DELIAISON_REFUSEE_DERNIER_MOYEN_CONNEXION: {
        code: 'FORBIDDEN',
        message:
          "Impossible de délier cette identité : c'est votre seul moyen de connexion (aucun mot de passe défini, aucune autre identité liée)",
      },
    },
  };

export const HandleUserOidcIdentitiesErrorEnum =
  createErrorsEnum(specificErrors);
export type HandleUserOidcIdentitiesError =
  keyof typeof HandleUserOidcIdentitiesErrorEnum;
