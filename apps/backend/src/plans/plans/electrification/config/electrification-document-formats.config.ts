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
    fieldPlaceholders: {
      axe: "N° et intitulé de l'axe (ex : 1. Logements privés : sortie du fioul et du gaz)",
      sousAxe:
        'N° et intitulé du sous-axe (ex : 1.1 Connaître et cibler les logements privés chauffés au fioul et au gaz)',
      titre: "Intitulé de l'action (peut reprendre celui du Référentiel1)",
      structures: 'Structure(s) responsable de l’action',
      statut:
        "À venir / En cours / Réalisé / En pause / Bloqué / Abandonné (ne conserver qu'une mention)",
    },
    indicateurs: {
      placeholders: {
        reference: ["Code de l'indicateur dans le Référentiel, si connu"],
        titre: [
          "Intitulé de l'indicateur, repris à l'identique du Référentiel",
          'Autres indicateurs (hors référentiel) : Intitulé et unité (ex : nombre de boulangeries ayant remplacé leur four au gaz)',
        ],
      },
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
    fieldPlaceholders: {},
    indicateurs: {
      placeholders: {
        reference: [fields.reference.placeholder],
        titre: [fields.titre.placeholder],
      },
      columns: [
        { field: 'reference', label: fields.reference.label },
        { field: 'titre', label: fields.titre.label },
        ...observations,
      ],
      allowMergedReferenceAndTitle: false,
    },
  },
} as const;

export type ElectrificationDocumentFormat =
  (typeof electrificationDocumentFormats)[keyof typeof electrificationDocumentFormats];
