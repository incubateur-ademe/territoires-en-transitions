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

  suppressionDonneesCollectivite: ({ periode }: { periode: string }): string =>
    `des données de la collectivité pour la période ${periode}`,
  suppressionPeriodeAttention: ({ periode }: { periode: string }): string =>
    `Attention, les données existantes pour la période ${periode} seront supprimées.`,
  commentaireIndicateurTitre: ({
    sourceTypeLabel,
    unite,
    periode,
  }: {
    sourceTypeLabel: string;
    unite: string;
    periode: string;
  }): string => `Mes ${sourceTypeLabel} (${unite}) : ${periode}`,
  champPeriodiciteIndicateur: 'Périodicité *',
  periodiciteAnnuelle: 'Annuelle',
  periodiciteMensuelle: 'Mensuelle',
  placeholderPeriodiciteIndicateur: 'Sélectionner une périodicité',
  champMois: 'Mois *',
  validerAjouterMois: 'Valider et ajouter un mois',
  ajouterMois: 'Ajouter un mois',
};
