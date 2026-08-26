import { plural } from '@tet/ui/labels/plural';

export const indicateursLabels = {
  indicateurResultat: plural({ one: 'résultat', other: 'résultats' }),
  indicateurObjectif: plural({ one: 'objectif', other: 'objectifs' }),

  /** Filtres */
  indicateurTous: 'Tous les indicateurs',
  indicateursPersonnalises: 'Indicateurs personnalisés',
  indicateursFavoris: 'Indicateurs favoris',
  indicateursFavorisTooltip: 'Indicateurs favoris de la collectivité',
  indicateurClePluriel: 'Indicateurs clés',
  indicateursPrives: 'Indicateurs privés',
  indicateurMonPluriel: 'Mes indicateurs',
  indicateurMonTooltip: 'Indicateurs dont je suis la personne pilote',

  indicateurCompleteParCollectivite: 'Indicateur complété par la collectivité',
};
