import {
  createIssueFactory,
  type ElectrificationIssue,
} from '../electrification-issue';

export const electrificationEngagementsErrors = {
  DUPLICATE_CATALOGUE_REFERENCE: {
    kind: 'configuration-error',
    message: 'Une référence du catalogue est présente plusieurs fois.',
  },
  INVALID_CATALOGUE_PARENT: {
    kind: 'configuration-error',
    message: 'Une référence du catalogue désigne un axe inexistant.',
  },
  INVALID_ENGAGEMENT_MAPPING: {
    kind: 'configuration-error',
    message:
      'Un engagement du catalogue doit définir soit une action, soit des cibles.',
  },
  DUPLICATE_SOURCE_KEY: {
    kind: 'document-error',
    message: 'Une clé de source est utilisée plusieurs fois dans le document.',
  },
  DUPLICATE_ENGAGEMENT: {
    kind: 'document-error',
    message: 'Un engagement est sélectionné plusieurs fois.',
  },
  UNKNOWN_ENGAGEMENT: {
    kind: 'document-error',
    message: "Le code d'engagement ne figure pas dans le catalogue.",
  },
  DUPLICATE_TARGET_KEY: {
    kind: 'document-error',
    message: 'Une cible est renseignée plusieurs fois pour cet engagement.',
  },
  UNKNOWN_TARGET_KEY: {
    kind: 'document-error',
    message: "Cette cible ne correspond pas à l'engagement sélectionné.",
  },
  UNKNOWN_AXIS: {
    kind: 'document-error',
    message:
      "Le numéro d'axe ne figure pas dans le catalogue. Vérifiez le numéro dans le champ Axe de l'action à partir du référentiel fourni avec le canevas.",
  },
  SUB_AXES_CATALOGUE_UNAVAILABLE: {
    kind: 'configuration-error',
    message:
      "La correspondance des sous-axes manque dans le catalogue. Contactez le support TeT pour le compléter, puis relancez l'import avec le même document.",
  },
  UNKNOWN_SUB_AXIS: {
    kind: 'document-error',
    message:
      "Le numéro de sous-axe ne figure pas dans le catalogue. Vérifiez le numéro dans le champ Sous-axe de l'action à partir du référentiel fourni avec le canevas.",
  },
  INVALID_SUB_AXIS_PARENT: {
    kind: 'document-error',
    message:
      "Le sous-axe ne dépend pas de l'axe indiqué dans le document. Vérifiez le rattachement des champs Axe et Sous-axe de l'action à partir du référentiel fourni avec le canevas.",
  },
  INVALID_ELECTRIFICATION_INPUT: {
    kind: 'document-error',
    message: "Les données extraites de l'annexe sont incomplètes ou invalides.",
  },
  UNAUTHORIZED: {
    kind: 'processing-error',
    message: "Vous n'avez pas les droits nécessaires pour importer ce plan.",
  },
  UNSUPPORTED_ELECTRIFICATION_CATALOGUE: {
    kind: 'configuration-error',
    message:
      "Cette version du catalogue Électrification est indisponible. Contactez le support TeT pour rétablir son accès, puis relancez l'import avec le même document.",
  },
  INDICATEUR_RESOLUTION_FAILED: {
    kind: 'processing-error',
    message: "Les indicateurs n'ont pas pu être vérifiés. Réessayez plus tard.",
  },
  MISSING_ENGAGEMENT_INDICATEUR: {
    kind: 'configuration-error',
    message:
      "Un indicateur d'engagement attendu est absent ou inaccessible dans le catalogue. Contactez le support TeT pour le vérifier, puis relancez l'import avec le même document.",
  },
  UNVALIDATED_ENGAGEMENT_INDICATEUR: {
    kind: 'configuration-error',
    message:
      "La correspondance de cet indicateur d'engagement n'est pas encore validée dans le catalogue. Contactez le support TeT pour la faire valider, puis relancez l'import avec le même document.",
  },
  INCOMPATIBLE_ENGAGEMENT_INDICATEUR: {
    kind: 'configuration-error',
    message:
      "L'unité ou la périodicité de cet indicateur est incohérente dans le catalogue. Contactez le support TeT pour la corriger, puis relancez l'import avec le même document.",
  },
  INVALID_ENGAGEMENT_UNIT: {
    kind: 'document-error',
    message: "L'unité de la cible ne correspond pas à celle de l'engagement.",
  },
  INVALID_ENGAGEMENT_PERIOD: {
    kind: 'document-error',
    message:
      "Une cible renseignée doit avoir son unité et l'échéance 2030 de l'annexe.",
  },
  INVALID_ENGAGEMENT_VALUE: {
    kind: 'document-error',
    message:
      'La cible doit être positive ou nulle, et ne peut pas dépasser 100 % pour un pourcentage.',
  },
  EMPTY_ENGAGEMENT_TARGET: {
    kind: 'warning',
    message: "La cible de cet engagement n'est pas renseignée.",
  },
  INCONSISTENT_E07_TARGETS: {
    kind: 'document-error',
    message:
      'Le nombre de bornes rapides ne peut pas dépasser le nombre total de bornes.',
  },
} as const satisfies Record<
  string,
  Pick<ElectrificationIssue, 'kind' | 'message'>
>;

export type ElectrificationEngagementsErrorCode =
  keyof typeof electrificationEngagementsErrors;

export const electrificationEngagementsIssue = createIssueFactory(
  electrificationEngagementsErrors
);
