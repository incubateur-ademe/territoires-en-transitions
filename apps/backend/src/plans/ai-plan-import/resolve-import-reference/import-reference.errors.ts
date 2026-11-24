import type { ImportReport } from '../models/import-report';

export const importReferenceErrors = {
  INVALID_IMPORT_REFERENCE_URL: {
    kind: 'document-error',
    message:
      'Le lien fourni ne désigne pas une action ou un indicateur TeT reconnu.',
  },
  IMPORT_REFERENCE_ORIGIN_MISMATCH: {
    kind: 'document-error',
    message:
      "Ce lien renvoie vers un autre site ou un autre environnement. Copiez le lien de l'action ou de l'indicateur depuis le site où vous effectuez cet import. Changer seulement le domaine ne garantit pas de retrouver la même donnée.",
  },
  UNSUPPORTED_FICHE_UID: {
    kind: 'document-error',
    message:
      "Cet ancien identifiant d'action ne peut pas être résolu. Utilisez son lien actuel dans TeT.",
  },
  FICHE_REFERENCE_UNAVAILABLE: {
    kind: 'document-error',
    message:
      "L'action est absente ou ne peut pas être reliée à ce plan avec vos droits. Vérifiez son lien et son accès depuis la collectivité où vous importez.",
  },
  FICHE_REFERENCE_OTHER_COLLECTIVITE: {
    kind: 'document-error',
    message:
      "Ce lien désigne une autre collectivité et l'action ne peut pas être reliée à ce plan avec vos droits. Utilisez le lien d'une action de la collectivité où vous importez, ou d'une action partagée avec elle.",
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

const importReferenceErrorLabels = {
  reference: (reference: string) =>
    `Lien indiqué dans le document : ${reference}`,
  expectedOrigin: (origin: string) => `Site d'import : ${origin}`,
};

export class ImportReferenceErrors {
  static issue(
    code: ImportReferenceErrorCode,
    reference: string,
    expectedOrigin?: string
  ): ImportReport['issues'][number] {
    return {
      code,
      ...importReferenceErrors[code],
      message: [
        importReferenceErrors[code].message,
        importReferenceErrorLabels.reference(reference),
        ...(expectedOrigin
          ? [importReferenceErrorLabels.expectedOrigin(expectedOrigin)]
          : []),
      ].join('\n'),
    };
  }
}
