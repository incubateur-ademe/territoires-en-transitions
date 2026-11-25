import { plural } from '@tet/ui/labels/plural';

export const indicateursLabels = {
  indicateurPeriodiciteScoreTooltip:
    'Cet indicateur doit être suivi à la maille annuelle : il participe au score du programme TETE. Sa périodicité ne peut pas être modifiée.',
  indicateurPeriodiciteTooltip: (periodicite: string) =>
    `La périodicité ${periodicite.toLowerCase()} s’applique à la saisie et à l’affichage de cet indicateur. Elle est fixée à sa création et ne peut pas être modifiée.`,
  indicateurAjouterObjectif: 'Ajouter un objectif',
  indicateurAjouterDonnee: 'Ajouter une donnée',
  indicateurChampValeur: (type: string, periode: string) =>
    `${type} — ${periode}`,
  indicateurCommentairesPeriode: (periode: string) =>
    `Commentaires — ${periode}`,
  indicateurSupprimerPeriode: (periode: string) =>
    `Supprimer la période ${periode}`,
  indicateurValeurAbsente: 'Non renseigné',
  indicateurDonneeIndisponible: 'Donnée indisponible',
  indicateurSousIndicateursTotal: 'Total',
  indicateurSousIndicateursTotalSomme: 'Total (somme)',
  indicateurSousIndicateursObjectifDe: ({ label }: { label: string }) =>
    `Objectif – ${label}`,
  indicateurValeurMasquee: 'Valeur masquée',
  indicateurTotalManquant: ({
    champ,
    sousIndicateurs,
  }: {
    champ: string;
    sousIndicateurs: readonly string[];
  }) => `${champ} manquant : ${sousIndicateurs.join(', ')}`,
  indicateurSousIndicateursValeurs: 'Valeurs des sous-indicateurs',
  indicateurSousIndicateursChargement: 'Chargement des sous-indicateurs',
  indicateurSousIndicateursErreur: 'Impossible de charger les sous-indicateurs',
  indicateurSousIndicateursGraphiqueAlternativeTableau:
    'Les mêmes valeurs sont dans le tableau sous le graphique',
  indicateurSeparateurAncetres: '>',
  indicateurSuppressionParentTitre:
    'Vous êtes sur le point de supprimer cet indicateur.',
  indicateurSuppressionParentSousIndicateurs: ({ count }: { count: number }) =>
    count === 1
      ? 'Son sous-indicateur ne sera pas supprimé : il devient un indicateur indépendant, avec ses données.'
      : `Ses ${count} sous-indicateurs ne seront pas supprimés : ils deviennent des indicateurs indépendants, avec leurs données.`,
  indicateurUnite: 'Unité',
  indicateurUniteDuParent: ({ parent }: { parent: string }) =>
    `Ce sous-indicateur s'appuie sur l'unité de son indicateur parent, ${parent}`,
  indicateurCumulSousIndicateurs: 'Cumul des sous-indicateurs',
  indicateurResultatRecentModePrive: 'Résultat récent en mode privé',
  indicateurResultatRecentModePriveInfo:
    "Si le mode privé est activé, le résultat le plus récent n'est plus consultable par les personnes n’étant pas membres de votre collectivité. Seuls les autres résultats restent accessibles pour tous les utilisateurs et la valeur privée reste consultable par l’ADEME et le service support de la plateforme.",
  indicateurActions: "Actions de l'indicateur",
  indicateurCreerSousIndicateur: 'Créer un sous-indicateur',
  indicateurSousIndicateurRenommer: ({ label }: { label: string }) =>
    `Renommer ${label}`,
  indicateurSousIndicateurNom: 'Nom du sous-indicateur',
  indicateurSousIndicateurOuvrir: ({ label }: { label: string }) =>
    `Ouvrir ${label}`,
  indicateurSousIndicateurRenommeErreur:
    "Le sous-indicateur n'a pas pu être renommé",
  indicateurSousIndicateurNomProvisoire: ({ numero }: { numero: number }) =>
    `Sous-indicateur ${numero}`,
  indicateurSousIndicateurCree: 'Le sous-indicateur a été créé',
  indicateurSousIndicateurCreeErreur: "Le sous-indicateur n'a pas pu être créé",
  indicateurSousIndicateurDissocier: ({ label }: { label: string }) =>
    `Dissocier ${label}`,
  indicateurSousIndicateurDissocierInfo:
    "Ce sous-indicateur sera dissocié de l'indicateur parent. Ses données et son unité sont conservées.",
  indicateurSousIndicateurDissocie: 'Le sous-indicateur a été dissocié',
  indicateurSousIndicateurDissocieErreur:
    "Le sous-indicateur n'a pas pu être dissocié",
  indicateurSousIndicateurNiveau: ({ niveau }: { niveau: number }) =>
    `niveau ${niveau}`,
  indicateurSousIndicateurDeplier: ({ label }: { label: string }) =>
    `Déplier ${label}`,
  indicateurSousIndicateurReplier: ({ label }: { label: string }) =>
    `Replier ${label}`,
  indicateurTableDefilement: 'Défilement horizontal du tableau',
  indicateurOptions: "Plus d'options",
  indicateurTelechargerExcel: "Télécharger l'indicateur (Excel)",

  indicateur: plural({ one: 'indicateur', other: 'indicateurs' }),
  sousIndicateur: plural({
    one: 'sous-indicateur',
    other: 'sous-indicateurs',
  }),
  indicateurOngletDonnees: 'Données',
  indicateurOngletInformations: 'Informations sur l’indicateur',

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
    'Ma collectivité ne dispose pas à ce jour des données pour renseigner cet indicateur',
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
  indicateurAnneeExistante: 'Cette année est déjà présente dans le tableau.',
  indicateurValeurAjoutee: 'La valeur a été ajoutée',
  indicateurValeurAjouteeErreur: "La valeur n'a pas pu être ajoutée",
  indicateurValeurModifieeErreur: "La valeur n'a pas pu être modifiée",
  indicateurSuppressionDonneesCollectivite: (periodeLabel: string) =>
    `des données de la collectivité pour la période ${periodeLabel}`,
  indicateurSuppressionPeriodeAttention: (periodeLabel: string) =>
    `Attention, les données existantes pour la période ${periodeLabel} seront supprimées.`,
  indicateurPeriodeSupprimee: (periodeLabel: string) =>
    `La période ${periodeLabel} a été supprimée`,
  indicateurPeriodeSuppressionErreur: (periodeLabel: string) =>
    `La période ${periodeLabel} n'a pas pu être supprimée`,
  indicateurSourcePeriodicite: (label: string, cadence: string) =>
    `${label} · ${cadence}`,
  indicateurSourceVersion: (id: number) => `Source ${id}`,
  periodiciteAnnuelle: 'Annuelle',
  periodiciteDeclarationCollectivite: 'Périodicité de suivi de ma collectivité',
  periodiciteImmuable:
    'Cette périodicité s’applique à la saisie et à l’affichage. Elle ne peut plus être modifiée après la création de l’indicateur.',
  champPeriodiciteIndicateur: 'Périodicité de suivi *',
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
  indicateurPeriodeExistante: 'Cette période existe déjà',
  indicateurPeriodeAjoutee: 'Période ajoutée',
  indicateurColonnesAjoutees: 'Les colonnes ont été ajoutées',
  indicateurColonnesAjouteesErreur: "Les colonnes n'ont pas pu être ajoutées",
  indicateurAjouterAutreColonne: 'Ajouter une autre colonne',
  indicateurRetirerColonne: 'Retirer cette colonne',
  indicateurColonne: (numero: number) => `Colonne ${numero}`,
  indicateurColonneExistante: (periode: string) =>
    `La période ${periode} est déjà présente.`,
  indicateurSelectMois: 'Mois',
  indicateurSelectTrimestre: 'Trimestre',
  indicateurSelectSemestre: 'Semestre',
  indicateurTrimestreCourt: (numero: number) => `T${numero}`,
  indicateurSemestreCourt: (numero: number) => `S${numero}`,
  indicateurMois: [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ],
  // filtre de sources quand la SNBC 3 est servie (flag SNBC 3)
  sourceSnbc2: 'Trajectoire SNBC2',
  sourceSnbc3: 'Trajectoire SNBC3',
  indicateurMethodologieSnbc3Texte:
    'Méthodologie SNBC 3 à télécharger depuis la page Trajectoire.',
};
