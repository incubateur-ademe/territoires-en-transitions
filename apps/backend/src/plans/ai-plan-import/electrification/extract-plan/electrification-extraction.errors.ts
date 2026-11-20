import { StatutEnum } from '@tet/domain/plans';
import { electrificationEngagementsDocument } from '@tet/backend/plans/plans/electrification/config/electrification-engagements-document.config';
import type { ElectrificationDocumentSource } from './electrification-extraction.schema';
import { electrificationFichesErrors } from '../resolve-fiches/electrification-fiches.errors';
import {
  createIssueFactory,
  type ElectrificationIssue,
} from '../electrification-issue';
import { aiPlanImportJobErrorMessages } from '../../ai-plan-import.errors';

export const electrificationExtractionErrors = {
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
  INVALID_ELECTRIFICATION_SELECTION: {
    kind: 'document-error',
    message:
      'Indiquez Oui ou Non pour sélectionner un engagement du tableau A.',
  },
  INVALID_ELECTRIFICATION_TARGET: {
    kind: 'document-error',
    message:
      'La cible renseignée est ambiguë. Vérifiez sa valeur et distinguez chaque cible lorsque plusieurs sont attendues.',
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
