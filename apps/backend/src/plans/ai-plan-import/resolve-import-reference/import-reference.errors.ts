import type { ImportReport } from '../models/import-report';

export const importReferenceErrors = {
  INVALID_IMPORT_REFERENCE_URL: {
    kind: 'document-error',
    message:
      'Le lien fourni ne désigne pas une fiche ou un indicateur TeT reconnu.',
  },
  UNSUPPORTED_FICHE_UID: {
    kind: 'document-error',
    message:
      'Cet ancien identifiant de fiche ne peut pas être résolu. Utilisez son lien actuel dans TeT.',
  },
  FICHE_REFERENCE_UNAVAILABLE: {
    kind: 'document-error',
    message:
      'La fiche est absente ou ne peut pas être reliée à un plan de cette collectivité avec vos droits.',
  },
  INDICATEUR_REFERENCE_UNAVAILABLE: {
    kind: 'document-error',
    message: "L'indicateur est absent ou indisponible pour cette collectivité.",
  },
  IMPORT_REFERENCE_UNAUTHORIZED: {
    kind: 'processing-error',
    message: "Vous n'avez pas les droits nécessaires pour importer ce plan.",
  },
  IMPORT_REFERENCE_RESOLUTION_FAILED: {
    kind: 'processing-error',
    message: "Le lien n'a pas pu être vérifié. Réessayez plus tard.",
  },
} as const satisfies Record<
  string,
  Pick<ImportReport['issues'][number], 'kind' | 'message'>
>;

export type ImportReferenceErrorCode = keyof typeof importReferenceErrors;
