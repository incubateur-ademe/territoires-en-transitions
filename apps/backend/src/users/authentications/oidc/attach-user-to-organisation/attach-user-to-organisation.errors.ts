import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['ATTACH_ORGANISATION_ERROR'] as const;

/** Pas de config tRPC : aucun router n'expose ce use-case. */
export const AttachUserToOrganisationErrorEnum =
  createErrorsEnum(specificErrors);
export type AttachUserToOrganisationError =
  keyof typeof AttachUserToOrganisationErrorEnum;
