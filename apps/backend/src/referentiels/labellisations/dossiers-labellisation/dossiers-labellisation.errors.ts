import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'DOSSIER_NOT_FOUND',
  'DOSSIER_CLOS',
  'DECISION_NOT_ALLOWED',
  'ETOILES_REQUIRED',
  'ETOILES_NOT_ALLOWED_FOR_COT',
  'NOT_AUDITEUR',
  'AUDITEUR_EMAIL_NOT_FOUND',
  'LABELLISATION_ALREADY_EXISTS',
  'COT_NOT_FOUND',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const dossiersLabellisationErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      DOSSIER_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Le dossier demandé n'a pas été trouvé.",
      },
      DOSSIER_CLOS: {
        code: 'BAD_REQUEST',
        message: 'Le dossier est clos, il ne peut plus être modifié.',
      },
      DECISION_NOT_ALLOWED: {
        code: 'BAD_REQUEST',
        message:
          "Cette décision n'est pas possible au stade actuel du dossier.",
      },
      ETOILES_REQUIRED: {
        code: 'BAD_REQUEST',
        message: "L'étoile est obligatoire pour une demande de labellisation.",
      },
      ETOILES_NOT_ALLOWED_FOR_COT: {
        code: 'BAD_REQUEST',
        message: "Un audit COT seul ne porte pas d'étoile.",
      },
      NOT_AUDITEUR: {
        code: 'BAD_REQUEST',
        message: "Cette personne n'a pas le rôle auditeur.",
      },
      AUDITEUR_EMAIL_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: 'Aucun compte ne correspond à cet email.',
      },
      LABELLISATION_ALREADY_EXISTS: {
        code: 'CONFLICT',
        message:
          'Une labellisation existe déjà pour cette collectivité, ce référentiel et cette année.',
      },
      COT_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Cette collectivité n'a pas de COT.",
      },
    },
  };

export const DossiersLabellisationErrorEnum = createErrorsEnum(specificErrors);
export type DossiersLabellisationError =
  | keyof typeof DossiersLabellisationErrorEnum
  | 'UNAUTHORIZED';
