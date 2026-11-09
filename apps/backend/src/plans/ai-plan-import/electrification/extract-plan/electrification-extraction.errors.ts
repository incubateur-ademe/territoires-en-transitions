import type { ElectrificationIssue } from '../resolve-engagements/electrification-engagements.schema';

const extractionErrors = {
  AI_VALUE_INTERPRETATION_FAILED: {
    kind: 'processing-error',
    message:
      "L'aide à la lecture de cette valeur n'a pas abouti. Réessayez l'import ou simplifiez la cellule indiquée.",
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
    message: 'Les colonnes du tableau A ne correspondent pas au canevas Word.',
  },
  INVALID_ELECTRIFICATION_ENGAGEMENT: {
    kind: 'document-error',
    message: "L'engagement du tableau A ne correspond pas au canevas Word.",
  },
  INVALID_ELECTRIFICATION_SELECTION: {
    kind: 'document-error',
    message:
      'Indiquez Oui ou Non pour sélectionner un engagement du tableau A.',
  },
  INVALID_ELECTRIFICATION_TARGET: {
    kind: 'document-error',
    message:
      'La cible renseignée est ambiguë. Vérifiez sa valeur et, pour les bornes, distinguez le total des bornes rapides.',
  },
  INCOMPATIBLE_ELECTRIFICATION_CHECKPOINT: {
    kind: 'processing-error',
    message:
      'Le point de reprise ne correspond pas au contrat ou au catalogue Électrification actuel.',
  },
  INVALID_ELECTRIFICATION_DOCUMENT: {
    kind: 'document-error',
    message:
      "Aucun engagement retenu dans le tableau A ni fiche action renseignée dans la section B n'a été trouvé.",
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
  INVALID_EXTRACTION_PARENT: {
    kind: 'document-error',
    message:
      'La fiche action ne cite pas un axe ou sous-axe extrait du document.',
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
  static issue(
    code: keyof typeof extractionErrors,
    location?: string
  ): ElectrificationIssue {
    return {
      code,
      ...extractionErrors[code],
      ...(location ? { location } : {}),
    };
  }
}
