import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['ATTACH_ORGANISATION_ERROR'] as const;

type AttachUserToOrganisationSpecificError = (typeof specificErrors)[number];

export const attachUserToOrganisationErrorConfig: TrpcErrorHandlerConfig<AttachUserToOrganisationSpecificError> =
  {
    specificErrors: {
      ATTACH_ORGANISATION_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          'Le rattachement automatique à votre service a échoué. Votre connexion est valide : rapprochez-vous du support pour obtenir vos accès.',
      },
    },
  };

export const AttachUserToOrganisationErrorEnum =
  createErrorsEnum(specificErrors);
export type AttachUserToOrganisationError =
  keyof typeof AttachUserToOrganisationErrorEnum;
