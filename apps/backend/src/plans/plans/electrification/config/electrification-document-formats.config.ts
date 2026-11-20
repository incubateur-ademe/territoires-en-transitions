import { electrificationIndicateursDocument } from './electrification-indicateurs-document.config';

const { fields } = electrificationIndicateursDocument;
const observations = [
  { field: 'resultat', label: fields.resultat.label },
  { field: 'objectif', label: fields.objectif.label },
] as const;

/**
 * Différences observées entre les canevas Word officiels.
 * Les champs, sous-actions et engagements partagent le contrat de lecture commun.
 * La version est reconnue par l'en-tête du tableau, jamais par le nom du fichier.
 */
export const electrificationDocumentFormats = {
  v1: {
    indicateurs: {
      columns: [
        { field: 'reference', label: 'Code (facultatif)' },
        { field: 'titre', label: 'Indicateurs du Référentiel des actions' },
        ...observations,
        {
          field: 'objectifComplementaire',
          label: fields.objectifComplementaire.label,
        },
      ],
      allowMergedReferenceAndTitle: true,
    },
  },
  v4: {
    indicateurs: {
      columns: [
        { field: 'reference', label: fields.reference.label },
        { field: 'titre', label: fields.titre.label },
        ...observations,
      ],
      allowMergedReferenceAndTitle: false,
    },
  },
} as const;

export type ElectrificationIndicateursTableFormat =
  (typeof electrificationDocumentFormats)[keyof typeof electrificationDocumentFormats]['indicateurs'];
