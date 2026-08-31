import { plural } from '@tet/ui/labels/plural';

export const indicateursLabels = {
  indicateur: plural({ one: 'indicateur', other: 'indicateurs' }),

  indicateurResultat: plural({ one: 'résultat', other: 'résultats' }),
  indicateurObjectif: plural({ one: 'objectif', other: 'objectifs' }),

  /** Filtres */
  indicateurTous: 'Tous les indicateurs',
  indicateursPersonnalises: 'Indicateurs personnalisés',
  indicateursFavoris: 'Indicateurs favoris',
  indicateursFavorisTooltip: 'Indicateurs favoris de ma collectivité',
  indicateurClePluriel: 'Indicateurs clés',
  indicateursPrives: 'Indicateurs privés',
  indicateurMonPluriel: 'Mes indicateurs',
  indicateurMonTooltip: 'Indicateurs dont je suis la personne pilote',

  indicateurCompleteParCollectivite: 'Indicateur complété par la collectivité',

  /** Actions */
  indicateurCreer: 'Créer un indicateur',

  /** Modale création */
  indicateurCreerAlertDescription:
    'Vous pouvez créer vos propres indicateurs pour suivre une ou plusieurs actions de la collectivité.',
  indicateurCreerCheckboxFavoris:
    'Ajouter cet indicateur aux favoris de ma collectivité',

  /** Autres */
  aucunIndicateur: 'Aucun indicateur associé',
};
