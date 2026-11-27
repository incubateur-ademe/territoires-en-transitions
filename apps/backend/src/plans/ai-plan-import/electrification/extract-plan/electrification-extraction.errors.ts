import { ElectrificationConfig, StatutEnum } from '@tet/domain/plans';
import { electrificationEngagementsDocument } from '@tet/backend/plans/plans/electrification/config/electrification-engagements-document.config';
import type { ElectrificationDocumentSource } from './electrification-extraction.schema';
import type { ElectrificationValueRejection } from './electrification-value-interpretation.schema';
import { electrificationFichesErrors } from '../resolve-fiches/electrification-fiches.errors';
import {
  createIssueFactory,
  type ElectrificationIssue,
} from '../electrification-issue';
import { aiPlanImportJobErrorMessages } from '../../ai-plan-import.errors';
import { ElectrificationImportLocations as Locations } from '../electrification-import-locations';

export const electrificationExtractionErrors = {
  APPROXIMATE_ELECTRIFICATION_VALUE: {
    kind: 'document-error',
    message:
      'La valeur est approximative. Saisissez un nombre précis, par exemple "12 (2026)".',
  },
  CONTRADICTORY_ELECTRIFICATION_VALUE: {
    kind: 'document-error',
    message:
      'La cellule contient des informations contradictoires. Corrigez-les pour indiquer une valeur certaine.',
  },
  CONDITIONAL_ELECTRIFICATION_VALUE: {
    kind: 'document-error',
    message:
      "La valeur dépend d'une condition. Renseignez une valeur retenue sans condition et reportez les réserves dans la description de l'action.",
  },
  INSTRUCTIONS_IN_ELECTRIFICATION_VALUE: {
    kind: 'document-error',
    message:
      'La cellule contient une consigne à interpréter. Remplacez-la par la valeur à importer.',
  },
  UNRESOLVED_ELECTRIFICATION_VALUE: {
    kind: 'document-error',
    message:
      "Cette cellule ne permet pas d'identifier une valeur certaine pour chaque cible. Précisez les quantités, leurs unités et leurs échéances, sans condition ni approximation.",
  },
  MISSING_INDICATEUR_YEAR: electrificationFichesErrors.MISSING_INDICATEUR_YEAR,
  SOURCE_UNREADABLE: {
    kind: 'processing-error',
    message: aiPlanImportJobErrorMessages.SOURCE_UNREADABLE,
  },
  AI_VALUE_INTERPRETATION_FAILED: {
    kind: 'processing-error',
    message:
      "L'aide à la lecture de cette valeur n'a pas abouti. Réessayez l'import ou simplifiez la cellule indiquée.",
  },
  AI_ENGAGEMENT_INTERPRETATION_FAILED: {
    kind: 'processing-error',
    message:
      "Le rapprochement de cet engagement avec le catalogue n'a pas abouti. Réessayez l'import.",
  },
  INVALID_ELECTRIFICATION_VALUE_INTERPRETATION: {
    kind: 'document-error',
    message:
      "La valeur ne peut pas être interprétée sans ambiguïté. Renseignez explicitement le nombre, son unité et l'année dans la cellule indiquée.",
  },
  UNSUPPORTED_ELECTRIFICATION_DOCUMENT: {
    kind: 'document-error',
    message:
      'Utilisez le canevas Word (.docx) Électrification. Les autres formats ne sont pas pris en charge pour ce profil.',
  },
  UNSUPPORTED_ELECTRIFICATION_STRUCTURE: {
    kind: 'document-error',
    message:
      "La structure du formulaire n'est pas reconnue. Conservez les sections et les tableaux du canevas Word.",
  },
  INVALID_ELECTRIFICATION_FIELD: {
    kind: 'document-error',
    message:
      'Le champ est manquant, répété ou illisible. Vérifiez la cellule indiquée dans le document.',
  },
  MISSING_ELECTRIFICATION_AXIS: {
    kind: 'document-error',
    message:
      "Renseignez l'axe de l'action (exemple : 1 ou Axe 1), ou le titre d'un axe propre au territoire.",
  },
  INVALID_ELECTRIFICATION_AXIS: {
    kind: 'document-error',
    message:
      "Le champ Axe attend un numéro d'axe seul (exemple : 1). Pour un sous-axe, utilisez le champ Sous-axe.",
  },
  INVALID_ELECTRIFICATION_SUB_AXIS: {
    kind: 'document-error',
    message:
      "Format attendu pour le sous-axe : 1.2, ou le titre d'un sous-axe propre au territoire.",
  },
  INVALID_ELECTRIFICATION_STATUS: {
    kind: 'document-error',
    message: `Statut non reconnu. Valeurs possibles : ${Object.values(
      StatutEnum
    ).join(', ')}.`,
  },
  DUPLICATE_ELECTRIFICATION_FIELD: {
    kind: 'document-error',
    message:
      'Ce champ est renseigné plusieurs fois. Gardez une seule ligne pour ce champ.',
  },
  MISSING_ELECTRIFICATION_SOUS_ACTION_TITLE: {
    kind: 'document-error',
    message:
      "L'intitulé de la sous-action est vide. Renseignez-le ou retirez la ligne.",
  },
  INVALID_ELECTRIFICATION_BOOLEAN: {
    kind: 'document-error',
    message:
      "Cet indicateur attend Oui ou Non, avec l'année du résultat. Une valeur numérique ne peut pas être utilisée.",
  },
  CONFLICTING_INDICATEUR_UNITS: {
    kind: 'document-error',
    message:
      "Des unités différentes sont indiquées. Gardez une seule unité, celle du catalogue si l'indicateur est référencé par code.",
  },
  UNEXPECTED_ELECTRIFICATION_TARGET: {
    kind: 'document-error',
    message:
      "Cet engagement n'attend pas de cible chiffrée. Laissez la cellule de valeur vide.",
  },
  INVALID_ELECTRIFICATION_DATES: {
    kind: 'document-error',
    message:
      'La date de fin est antérieure à la date de début. Corrigez les dates de cette action.',
  },
  INVALID_ELECTRIFICATION_DATE: {
    kind: 'document-error',
    message:
      'Renseignez une date valide : JJ/MM/AAAA, MM/AAAA ou mois et année (exemple : novembre 2026).',
  },
  INVALID_ELECTRIFICATION_INDICATEUR: {
    kind: 'document-error',
    message:
      "La valeur de l'indicateur est ambiguë. Renseignez une valeur numérique ou Oui/Non, avec l'année du résultat et une unité explicite.",
  },
  INVALID_ELECTRIFICATION_ENGAGEMENT_TABLE: {
    kind: 'document-error',
    message: `Tableau des engagements : les titres de colonnes ont été modifiés. Colonnes attendues : ${Object.values(
      electrificationEngagementsDocument.columns
    ).join(', ')}. Ne modifiez pas la ligne d'en-tête.`,
  },
  INVALID_ELECTRIFICATION_ENGAGEMENT: {
    kind: 'document-error',
    message:
      "Cet engagement n'a pas été reconnu. Ne modifiez pas la phrase de la colonne Engagement du programme. Contactez-nous avec votre document.",
  },
  INTERPRETED_ELECTRIFICATION_ENGAGEMENT: {
    kind: 'warning',
    message:
      "Rapprochement à vérifier. Le libellé du document a été rapproché par IA d'un engagement du catalogue, sans garantie d'équivalence de périmètre. Les cibles renseignées sont rattachées sans conversion. Vérifiez que ce rattachement correspond à votre intention.",
  },
  UNTOLERATED_ELECTRIFICATION_ENGAGEMENT: {
    kind: 'document-error',
    message:
      "Ce libellé nécessite un rapprochement par IA, dont la tolérance est désactivée. Utilisez le code ou le libellé de l'engagement du catalogue.",
  },
  INVALID_ELECTRIFICATION_SELECTION: {
    kind: 'document-error',
    message:
      'Indiquez Oui ou Non pour sélectionner un engagement du tableau A.',
  },
  INVALID_ELECTRIFICATION_TARGET: {
    kind: 'document-error',
    message:
      "La cible renseignée ne peut pas être importée. Saisissez une valeur en chiffres par cible renseignée, sans alternative, en respectant l'unité et l'échéance attendues.",
  },
  INCOMPATIBLE_ELECTRIFICATION_CHECKPOINT: {
    kind: 'processing-error',
    message:
      'Le point de reprise ne correspond pas au contrat ou au catalogue Électrification actuel.',
  },
  INVALID_ELECTRIFICATION_DOCUMENT: {
    kind: 'document-error',
    message:
      "Aucun engagement retenu dans le tableau A ni action renseignée dans la section B n'a été trouvé. Vérifiez que vous avez importé l'annexe remplie et non le canevas vierge.",
  },
  INVALID_ELECTRIFICATION_EXTRACTION: {
    kind: 'document-error',
    message: 'Les données extraites sont incomplètes ou invalides.',
  },
  INVALID_EXTRACTION_SOURCE: {
    kind: 'document-error',
    message:
      'La source citée ne correspond pas à la section attendue du document.',
  },
  INVALID_INTERPRETATION_SOURCE: {
    kind: 'processing-error',
    message:
      'Les interprétations doivent citer les valeurs originales du document.',
  },
  INVALID_EXTRACTION_PARENT: {
    kind: 'document-error',
    message: "L'action ne cite pas un axe ou sous-axe extrait du document.",
  },
  INVALID_EXTRACTION_REFERENCE: {
    kind: 'document-error',
    message: "Le code ou l'URL extrait n'est pas justifié par la source citée.",
  },
  CONFLICTING_EXTRACTION_REFERENCES: {
    kind: 'document-error',
    message:
      'Le champ de référence contient plusieurs références contradictoires.',
  },
  UNREADABLE_EXTRACTION_REFERENCE: {
    kind: 'document-error',
    message:
      "La destination du lien est illisible. Renseignez le code ou l'URL dans le document.",
  },
} as const satisfies Record<
  string,
  Pick<ElectrificationIssue, 'kind' | 'message'>
>;

export class ElectrificationExtractionErrors {
  static issue = createIssueFactory(electrificationExtractionErrors);

  static unexpectedLabel(
    source: ElectrificationDocumentSource,
    expected: readonly string[]
  ): ElectrificationIssue {
    return {
      ...this.issue('UNSUPPORTED_ELECTRIFICATION_STRUCTURE', source.location),
      message: `Libellé trouvé : "${source.text}". ${
        expected.length === 1 ? 'Libellé attendu' : 'Libellés possibles'
      } : ${expected
        .map((label) => `"${label}"`)
        .join(', ')}. Rétablissez le libellé du canevas Word.`,
    };
  }

  static invalidTableHeader(
    cells: ElectrificationDocumentSource[],
    expected: readonly (readonly string[])[],
    location: string
  ): ElectrificationIssue {
    const found = cells.map(({ text }) => `"${text}"`).join(' | ');
    const headers = expected
      .map((labels) => labels.map((label) => `"${label}"`).join(' | '))
      .join('\nou\n');
    return {
      ...this.issue('UNSUPPORTED_ELECTRIFICATION_STRUCTURE', location),
      message: `En-tête trouvé : ${found}.\nColonnes attendues :\n${headers}.\nRétablissez l'en-tête du canevas Word.`,
    };
  }

  static invalidTarget(
    source: ElectrificationDocumentSource,
    targets: ElectrificationConfig['engagements'][number]['cibles']
  ): ElectrificationIssue {
    const issue = this.valueIssue('INVALID_ELECTRIFICATION_TARGET', source);
    const expected = targets.map(
      ({ libelleSource, uniteImport, reglesImport }) =>
        `- "${libelleSource}" : unité ${uniteImport}, année ${reglesImport.annee}.`
    );
    return {
      ...issue,
      message: `${issue.message}\nCibles attendues :\n${expected.join('\n')}`,
    };
  }

  static engagementMatch(
    code:
      | 'INTERPRETED_ELECTRIFICATION_ENGAGEMENT'
      | 'UNTOLERATED_ELECTRIFICATION_ENGAGEMENT',
    source: Pick<ElectrificationDocumentSource, 'text' | 'location'>,
    engagement: { code: string; libelleSource: string }
  ): ElectrificationIssue {
    const issue = this.issue(
      code,
      Locations.entity('Engagement', source.text, source.location)
    );
    return {
      ...issue,
      message: `${issue.message} Document : "${source.text}". Catalogue (${engagement.code}) : "${engagement.libelleSource}".`,
    };
  }

  static rejectedValue(
    reason: ElectrificationValueRejection['reason'],
    source: ElectrificationDocumentSource
  ): ElectrificationIssue {
    const codes = {
      approximation: 'APPROXIMATE_ELECTRIFICATION_VALUE',
      ambiguity: 'UNRESOLVED_ELECTRIFICATION_VALUE',
      contradiction: 'CONTRADICTORY_ELECTRIFICATION_VALUE',
      condition: 'CONDITIONAL_ELECTRIFICATION_VALUE',
      instruction: 'INSTRUCTIONS_IN_ELECTRIFICATION_VALUE',
    } as const satisfies Record<
      ElectrificationValueRejection['reason'],
      keyof typeof electrificationExtractionErrors
    >;
    return this.valueIssue(codes[reason], source);
  }

  static valueIssue(
    code: keyof typeof electrificationExtractionErrors,
    source: Pick<ElectrificationDocumentSource, 'text'> & { location?: string }
  ): ElectrificationIssue {
    const issue = this.issue(code, source.location);
    return {
      ...issue,
      message: `${issue.message} Valeur saisie : "${source.text}".`,
    };
  }
}
