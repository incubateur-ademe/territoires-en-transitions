import { plural } from '@tet/ui/labels/plural';

export const indicateursLabels = {
  periodiciteDeclarationCollectivite:
    'Périodicité de déclaration de ma collectivité',
  periodiciteAffichageGraphique: 'Périodicité d’affichage',
  periodiciteAffichageGraphiqueHint:
    'Les valeurs sont regroupées selon les règles de l’indicateur. Un regroupement incomplet ou sans règle définie reste vide. Les données sources restent inchangées.',
  periodiciteImmuable:
    'Cette périodicité est fixée à la création de l’indicateur.',
  indicateurAggregationResultat: 'Regroupement des résultats',
  indicateurAggregationObjectif: 'Regroupement des objectifs',
  indicateurAggregationAucune: 'Pas de regroupement',
  indicateurAggregationSomme: 'Somme',
  indicateurAggregationMoyenne: 'Moyenne',
  indicateurAggregationDerniereValeur: 'Dernière valeur',
  indicateurAggregationHint:
    'Choisissez une règle adaptée à votre indicateur pour consulter des périodes plus larges. Toutes les périodes doivent être renseignées.',
  indicateurAggregationConsultation:
    'Les valeurs regroupées sont en lecture seule. Pour modifier une valeur, revenez à sa périodicité de déclaration.',
  indicateurSourceVersion: (id: number) => `Source ${id}`,
  indicateurSourcePeriodicite: (label: string, cadence: string) =>
    `${label} · ${cadence}`,

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
  /**
   * Le texte qui s'affiche réellement depuis toujours : `catalog.ts` portait la
   * même clé et gagnait sur celle-ci. Reprise ici à l'identique — « Aucun
   * indicateur associé » n'a jamais atteint l'écran, et le décider est un choix
   * de copie, pas de rangement.
   */
  aucunIndicateur: 'Aucun indicateur',

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
  champPeriodiciteIndicateur: 'Périodicité de déclaration *',
  periodiciteAnnuelle: 'Annuelle',
  periodiciteMensuelle: 'Mensuelle',
  periodiciteTrimestrielle: 'Trimestrielle',
  periodiciteSemestrielle: 'Semestrielle',
  champTrimestre: 'Trimestre (ex. 2026-T1) *',
  champSemestre: 'Semestre (ex. 2026-S1) *',
  ajouterTrimestre: 'Ajouter un trimestre',
  ajouterSemestre: 'Ajouter un semestre',
  validerAjouterTrimestre: 'Valider et ajouter un trimestre',
  validerAjouterSemestre: 'Valider et ajouter un semestre',
  placeholderPeriodiciteIndicateur: 'Sélectionner une périodicité',
  champMois: 'Mois *',
  validerAjouterMois: 'Valider et ajouter un mois',
  ajouterMois: 'Ajouter un mois',
};
