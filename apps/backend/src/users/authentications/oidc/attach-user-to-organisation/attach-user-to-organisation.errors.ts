import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['ATTACH_ORGANISATION_ERROR'] as const;

/**
 * Pas de `TrpcErrorHandlerConfig` ici : le rattachement automatique n'est
 * exposé par aucun router. Il se déclenche au callback OIDC, et son échec ne
 * remonte jamais à un appelant — il est journalisé, et la connexion se
 * poursuit.
 */
export const AttachUserToOrganisationErrorEnum =
  createErrorsEnum(specificErrors);
export type AttachUserToOrganisationError =
  keyof typeof AttachUserToOrganisationErrorEnum;
