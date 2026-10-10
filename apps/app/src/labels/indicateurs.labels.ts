import { plural } from '@tet/ui/labels/plural';

export const indicateursLabels = {
  periodiciteDeclarationCollectivite:
    'Périodicité de déclaration de ma collectivité',
  periodiciteImmuable:
    'Cette périodicité s’applique à la saisie et à l’affichage. Elle ne peut plus être modifiée après la création de l’indicateur.',
  indicateurSourceVersion: (id: number) => `Source ${id}`,
  indicateurSourcePeriodicite: (label: string, cadence: string) =>
    `${label} · ${cadence}`,

  indicateur: plural({ one: 'indicateur', other: 'indicateurs' }),

  indicateurResultat: plural({ one: 'résultat', other: 'résultats' }),
  indicateurObjectif: plural({ one: 'objectif', other: 'objectifs' }),
  indicateurAjouterResultat: 'Ajouter un résultat',
  indicateurAjouterOuModifierResultat: 'Ajouter ou modifier un résultat',

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
  indicateurNonSuiviCheckboxLabel:
    'Je valide que ma collectivité ne suit pas cet indicateur',
  indicateurNonSuiviUpdateError: "L'indicateur n'a pas pu être mis à jour",
  indicateurModele: 'Liste',
  indicateurModeleCae: 'Référentiel CAE',
  indicateurModeleEci: 'Référentiel ECi',
  indicateurModeleCr: 'Référentiel CR',
  indicateurModeleCrte: 'Contrat de relance et de transition écologique (CRTE)',
  indicateurModeleDom: 'DOM',
  indicateurModeleHorsDom: 'Hors DOM',
  indicateurModelePcaet: 'PCAET',
  indicateurPrioritairePluriel: 'Indicateurs prioritaires',
  indicateurCategorieParNom: (nom: string) =>
    `Indicateurs ${nom.toUpperCase()}`,

  /** Vues enregistrées */
  indicateurVueCreateFromChanges: 'Créer une nouvelle vue',
  indicateurVueSave: 'Sauvegarder cette vue',
  indicateurVueSaveAsNew: 'Sauvegarder dans une nouvelle vue',
  indicateurVueName: 'Nom de la vue',
  indicateurVueSaveChanges: 'Enregistrer les modifications',
  indicateurVueDelete: 'Supprimer la vue',
  indicateurVueDeleteDescription: (nom: string) =>
    `Supprimer la vue « ${nom} » pour toute la collectivité ? Les indicateurs seront conservés.`,
  indicateurVueCountError: 'Nombre de correspondances indisponible',
  indicateurVueCreated: 'La vue a été créée',
  indicateurVueUpdated: 'La vue a été mise à jour',
  indicateurVueDeleted: 'La vue a été supprimée',
  indicateurVueSaveError: "Impossible d'enregistrer la vue",
  indicateurVueDeleteError: 'Impossible de supprimer la vue',
  indicateurVuesLoadError: 'Impossible de charger les vues enregistrées',
  indicateurVueUnavailable: 'Cette vue est indisponible',
  indicateurVueUnavailableDescription:
    "Elle a été supprimée, ses filtres ne sont plus valides ou vous n'avez pas accès à cette vue.",
  indicateurVueTypologie: 'Typologie :',
  indicateurVuePilotage: 'Pilotage :',
  indicateurVueSaved: 'Enregistré',
  indicateurVueUnsaved: 'Non enregistré',
  indicateurVueUnsavedTooltip:
    'Les modifications de filtres ne sont pas encore enregistrées dans cette vue personnalisée.',
  indicateurVueActions: 'Actions de cette vue',
  indicateurVueEditFilters: 'Modifier les filtres',

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
