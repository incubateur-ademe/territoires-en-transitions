import { plural } from '@tet/ui/labels/plural';

export const sharedLabels = {
  description: plural({ one: 'description', other: 'description' }),
  thematique: plural({ one: 'Thématique', other: 'Thématiques' }),
  sousThematique: plural({ one: 'Sous-thématique', other: 'Sous-thématiques' }),
  selectionnerThematiqueAvantSousThematique:
    "Veuillez d'abord sélectionner une thématique pour pouvoir sélectionner une ou plusieurs sous-thématiques",

  /** Filtres */
  filtrerSur: 'Filtrer sur',
  filtreSort: 'Tri',
  resultat: plural({
    one: 'résultat',
    other: 'résultats',
    zero: 'Aucun résultat',
  }),
  filtreNoPilote: 'Sans pilote',
};
