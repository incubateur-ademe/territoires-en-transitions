import { prepareFicheErrors } from '../../prepare-fiche/prepare-fiche.errors';
import { IndicateurPeriodicite } from '@tet/domain/indicateurs';
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
      "Les correspondances des actions sont incohérentes dans le catalogue Électrification. Aucune modification de votre document n'est attendue : contactez le support TeT, puis relancez l'import avec le même document.",
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
  UNKNOWN_INDICATEUR_REFERENCE: {
    kind: 'document-error',
    message:
      'Ce code ne figure pas dans le catalogue des indicateurs. Vérifiez-le dans le référentiel fourni avec le canevas.',
  },
  INVALID_INDICATEUR_ACTION: {
    kind: 'document-error',
    message:
      "Cet indicateur ne dépend pas de l'action de référence indiquée. Vérifiez les deux codes dans le référentiel fourni avec le canevas.",
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
  CONFLICTING_INDICATEUR_OBJECTIVES: {
    kind: 'document-error',
    message:
      'Deux objectifs différents sont renseignés pour la même année. Gardez une seule valeur pour cette année.',
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
      "L'année de référence de cette valeur est absente ou invalide pour cet indicateur. Renseignez une année explicite (exemple : 2025).",
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

  static unknownReference(
    reference: string,
    location?: string
  ): ElectrificationIssue {
    return {
      ...this.issue('UNKNOWN_FICHE_REFERENCE', location),
      message: `Le code "${reference}" n'existe pas dans le catalogue des actions Électrification. Vérifiez-le dans le référentiel des actions.`,
    };
  }

  static incompatiblePeriodicity(
    expected: IndicateurPeriodicite,
    supplied: string,
    location?: string
  ): ElectrificationIssue {
    return {
      ...this.issue('INVALID_INDICATEUR_PERIODICITY', location),
      message: `La périodicité de cet indicateur est ${expected}, mais le document fournit une valeur de périodicité ${supplied}. Contactez le support TeT avec votre document pour vérifier la définition à utiliser. Ne répartissez pas une valeur annuelle entre plusieurs périodes.`,
    };
  }
}
