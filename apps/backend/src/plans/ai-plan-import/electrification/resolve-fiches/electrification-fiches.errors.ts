import { prepareFicheErrors } from '../../prepare-fiche/prepare-fiche.errors';
import {
  createIssueFactory,
  ElectrificationIssue,
} from '../electrification-issue';

export const electrificationFichesErrors = {
  ...prepareFicheErrors,
  INVALID_FICHES_INPUT: {
    kind: 'document-error',
    message: 'Les fiches actions extraites sont incomplètes ou invalides.',
  },
  INVALID_FICHES_CONFIG: {
    kind: 'configuration-error',
    message:
      'Les correspondances des fiches actions Électrification sont incohérentes.',
  },
  FICHES_CONFIG_UNAVAILABLE: {
    kind: 'configuration-error',
    message:
      'Les correspondances de cette référence restent à livrer ou à valider.',
  },
  UNKNOWN_FICHE_REFERENCE: {
    kind: 'document-error',
    message:
      'Cette référence ne figure pas dans le catalogue des fiches actions Électrification.',
  },
  INVALID_FICHE_AXIS: {
    kind: 'document-error',
    message:
      "L'axe ou le sous-axe ne correspond pas à la référence de la fiche action.",
  },
  EXISTING_INDICATEUR_PRESERVED: {
    kind: 'preserved-data',
    message:
      "Seul le lien vers l'indicateur est préparé. Les champs et valeurs du document ne sont pas appliqués.",
  },
  INVALID_INDICATEUR_TYPE: {
    kind: 'document-error',
    message: "La nature de l'indicateur ne correspond pas au catalogue.",
  },
  INVALID_INDICATEUR_UNIT: {
    kind: 'document-error',
    message:
      "L'unité renseignée ne correspond pas à l'unité principale de l'indicateur.",
  },
  INVALID_INDICATEUR_PERIOD: {
    kind: 'document-error',
    message:
      "La périodicité ou la période de la valeur est absente ou incompatible avec l'indicateur.",
  },
  MISSING_INDICATEUR_UNIT: {
    kind: 'document-error',
    message: "L'unité de l'indicateur ou de sa valeur doit être renseignée.",
  },
  MISSING_FICHE_INDICATEUR: {
    kind: 'configuration-error',
    message:
      'La définition attendue est absente, ambiguë, inaccessible ou incompatible avec la correspondance validée.',
  },
  EMPTY_BOOLEAN_RESULT: {
    kind: 'warning',
    message: 'Le résultat oui/non est absent ; la sous-action reste À venir.',
  },
  FICHE_RESOLUTION_FAILED: {
    kind: 'processing-error',
    message:
      "Les références des fiches actions n'ont pas pu être vérifiées. Réessayez plus tard.",
  },
} as const satisfies Record<
  string,
  Pick<ElectrificationIssue, 'kind' | 'message'>
>;

export class ElectrificationFichesErrors {
  static issue = createIssueFactory(electrificationFichesErrors);
}
