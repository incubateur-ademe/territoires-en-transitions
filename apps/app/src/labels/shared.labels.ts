import { plural } from '@tet/ui/labels/plural';

export const sharedLabels = {
  /** Actions */
  valider: 'Valider',
  ajouter: 'Ajouter',
  annuler: 'Annuler',
  confirmer: 'Confirmer',
  selectionner: 'Sélectionner',
  fermer: 'Fermer',
  modifier: 'Modifier',
  supprimer: 'Supprimer',
  telecharger: 'Télécharger',
  enregistrer: 'Enregistrer',
  exporter: 'Exporter',
  exporterPdf: 'Exporter en PDF',
  rechercher: 'Rechercher',
  saisirLeTexte: 'Saisir le texte',

  /** Filtres */
  filtrer: 'Filtrer',
  filtrerSur: 'Filtrer sur',
  filtreSort: 'Tri',
  resultat: plural({
    one: 'résultat',
    other: 'résultats',
    zero: 'Aucun résultat',
  }),
  filtreNoPilote: 'Sans pilote',

  /** Autres */
  description: plural({ one: 'description', other: 'descriptions' }),
  descriptionWritePlaceholder: 'Saisir une description',
  thematique: plural({ one: 'Thématique', other: 'Thématiques' }),
  thematiquePlaceholderSelection: 'Sélectionner une ou plusieurs thématiques',
  sousThematique: plural({ one: 'Sous-thématique', other: 'Sous-thématiques' }),
  sousThematiqueSelectionTooltip:
    'Sélectionner une thématique pour pouvoir sélectionner une ou plusieurs sous-thématiques',
  historique: 'Historique',
};
