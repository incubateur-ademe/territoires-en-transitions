import { prepareFicheErrors } from '../../prepare-fiche/prepare-fiche.errors';
import {
  createIssueFactory,
  ElectrificationIssue,
} from '../electrification-issue';

export const electrificationFichesErrors = {
  ...prepareFicheErrors,
  INVALID_FICHES_INPUT: {
    kind: 'document-error',
    message: 'Les actions extraites sont incomplètes ou invalides.',
  },
  INVALID_FICHES_CONFIG: {
    kind: 'configuration-error',
    message:
      'Les correspondances des actions Électrification sont incohérentes.',
  },
  FICHES_CONFIG_UNAVAILABLE: {
    kind: 'configuration-error',
    message:
      "Cette référence est incomplète ou non validée dans le catalogue. Contactez le support TeT pour la vérifier, puis relancez l'import avec le même document.",
  },
  UNKNOWN_FICHE_REFERENCE: {
    kind: 'document-error',
    message:
      'Cette référence ne figure pas dans le catalogue des actions Électrification.',
  },
  INVALID_FICHE_AXIS: {
    kind: 'document-error',
    message:
      "L'axe ou le sous-axe ne correspond pas à la référence de l'action.",
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
      "La période de cette valeur est absente ou incompatible avec l'indicateur. Renseignez une année pour un indicateur annuel.",
  },
  INVALID_INDICATEUR_PERIODICITY: {
    kind: 'document-error',
    message:
      "La périodicité renseignée ne correspond pas à celle de l'indicateur.",
  },
  MISSING_INDICATEUR_YEAR: {
    kind: 'document-error',
    message:
      'L\'année de référence de cette valeur est absente. Ajoutez-la après la valeur, par exemple "12 (2025)" ou "Oui (2025)".',
  },
  MISSING_INDICATEUR_UNIT: {
    kind: 'document-error',
    message: "L'unité de l'indicateur ou de sa valeur doit être renseignée.",
  },
  MISSING_FICHE_INDICATEUR: {
    kind: 'configuration-error',
    message:
      "La définition de cet indicateur est absente ou incompatible avec le catalogue. Contactez le support TeT pour la vérifier, puis relancez l'import avec le même document.",
  },
  AIDE_WITHOUT_URL_IGNORED: {
    kind: 'warning',
    message:
      "Le catalogue ne fournit pas de lien pour cette aide. Elle n'a pas été ajoutée aux documents ; l'action peut être importée. Aucune correction du document n'est nécessaire pour cet avertissement.",
  },
  EMPTY_BOOLEAN_RESULT: {
    kind: 'warning',
    message: 'Le résultat oui/non est absent ; la sous-action reste À venir.',
  },
  FICHE_RESOLUTION_FAILED: {
    kind: 'processing-error',
    message:
      "Les références des actions n'ont pas pu être vérifiées. Réessayez plus tard.",
  },
} as const satisfies Record<
  string,
  Pick<ElectrificationIssue, 'kind' | 'message'>
>;

export class ElectrificationFichesErrors {
  static issue = createIssueFactory(electrificationFichesErrors);
}
