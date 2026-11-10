import { ImportReport } from '../models/import-report';

export const prepareFicheErrors = {
  MISSING_FICHE_TITLE: {
    kind: 'document-error',
    message:
      'Une action, une sous-action ou un indicateur à créer doit avoir un titre.',
  },
  INVALID_FICHE_DATES: {
    kind: 'document-error',
    message: 'La date de début doit précéder ou être égale à la date de fin.',
  },
  DUPLICATE_FICHE_REFERENCE: {
    kind: 'document-error',
    message:
      "Cette sous-action ou cet indicateur est renseigné plusieurs fois dans l'action.",
  },
  INVALID_FICHE_DEFAULTS: {
    kind: 'configuration-error',
    message: "Les compléments de l'action sont incomplets ou invalides.",
  },
  EXISTING_FICHE_PRESERVED: {
    kind: 'preserved-data',
    message:
      "Seul le lien vers l'action est préparé. Les champs, sous-actions et indicateurs du document ne sont pas appliqués.",
  },
} as const satisfies Record<
  string,
  Pick<ImportReport['issues'][number], 'kind' | 'message'>
>;

export class PrepareFicheErrors {
  static issue(
    code: keyof typeof prepareFicheErrors,
    location: string
  ): ImportReport['issues'][number] {
    return { code, ...prepareFicheErrors[code], location };
  }
}
