import { plural } from '@tet/ui/labels/plural';

export const plansLabels = {
  /** Plan */
  plan: plural({ one: 'plan', other: 'plans' }),
  nomPlan: 'Nom du plan',
  nomPlanRequis: 'Le nom du plan est requis',
  nomPlanTropLong: 'Le nom du plan ne doit pas dépasser 300 caractères',
  typePlan: 'Type de plan',
  axe: plural({ one: 'axe', other: 'axes' }),
  sousAxe: plural({ one: 'sous-axe', other: 'sous-axes' }),

  sansPlanCardTitle: "Aucun plan d'action renseigné !",
  sansPlanCardDescription:
    'Créer un plan sur la plateforme vous permet de piloter vos actions.',
  sansPlanCardDescriptionSecondLine:
    "Vous pouvez intégrer n'importe quel plan thématique, déjà approuvé ou en cours d'élaboration.",

  /** Action */
  action: plural({ one: 'action', other: 'actions' }),

  sousAction: plural({ one: 'sous-action', other: 'sous-actions' }),
  sousActionSupprimer: 'Supprimer la sous-action',
  sousActionAjouter: 'Ajouter une sous-action',

  ficheStatut: 'Statut',
  statutAVenir: 'À venir',
  statutADiscuter: 'À discuter',
  statutEnCours: 'En cours',
  statutRealise: 'Réalisé',
  statutEnRetard: 'En retard',
  statutEnPause: 'En pause',
  statutAbandonne: 'Abandonné',
  statutBloque: 'Bloqué',

  niveauPriorite: 'Niveau de priorité',
  prioriteEleve: 'Élevé',
  prioriteMoyen: 'Moyen',
  prioriteBas: 'Bas',

  ficheObjectif: plural({ one: 'objectif', other: 'objectifs' }),
  ficheObjectifWritePlaceholder: 'Saisir un objectif',
  actionSansPlan: 'Action sans emplacement',
  ficheEffetsAttendus: plural({
    one: 'Effet attendu',
    other: 'Effets attendus',
  }),
  ficheLibreTag: plural({
    one: 'Tag personnalisé',
    other: 'Tags personnalisés',
  }),
  ficheStructurePilote: plural({
    one: 'Structure pilote',
    other: 'Structures pilotes',
  }),
  fichePartenaire: plural({
    one: 'Partenaire',
    other: 'Partenaires',
  }),
  ficheCible: plural({
    one: 'Cible',
    other: 'Cibles',
  }),
  ficheInstanceGouvernance: plural({
    one: 'Instance de gouvernance',
    other: 'Instances de gouvernance',
  }),
  ficheInstanceGouvernancePlaceholderSelectionner: (
    isEditionAllowed: boolean
  ) =>
    `Sélectionner ${
      isEditionAllowed ? 'ou créer ' : ''
    }une instance de gouvernance`,
  ficheParticipationCitoyenne: plural({
    one: 'Participation citoyenne',
    other: 'Participation citoyenne',
  }),
  ficheParticipationSans: 'Sans participation citoyenne',
  participationConsultation: 'Consultation',
  participationConcertation: 'Concertation',
  participationCoConstruction: 'Co-construction',
  information: 'Information',
  ficheIndicateursAssociesEmptyDescription:
    "Mesurer les résultats et l'impact de l'action grâce à des indicateurs",
  ficheEmplacementModalTitle: "Mutualiser l'action dans un autre plan",
  ficheEmplacementModalAlert:
    "Le contenu de l'action sera mis à jour de manière synchronisée quel que soit l'emplacement",
  ficheEmplacementActuel: 'Emplacement actuel',
  ficheEmplacementAdditionel: 'Emplacement additionnel',
  ficheEmplacementAucunPlanRattacher:
    "Il n'existe aucun plan auquel rattacher cette action",
  ficheEmplacementValiderCetEmplacement: 'Valider cet emplacement',
  ficheBudget: 'Budget',
  ficheDetaillerBudgetParAnnee: 'Détailler le budget par année',
  ficheDetaillerBudgetParAnneeAlert: ({
    nextMode,
  }: {
    nextMode: string;
  }): string =>
    `Attention : en passant au mode ${nextMode}, les données budgétaires actuelles seront supprimées.`,
  ficheSupprimerBudgetDescription:
    "Ce budget sera supprimé définitivement de l'action. Souhaitez-vous vraiment supprimer ce budget ?",

  /** Filtres */
  filtreNoObjectif: 'Sans objectif',
  filtreNoReferent: 'Sans référent',
  filtreNoStatut: 'Sans statut',
  filtreNoPriorite: 'Sans niveau de priorité',
  filtreTypePeriode: 'Période appliquée à la date',
  filtreDebutPeriode: 'Du',
  filtreFinPeriode: 'Au',
  filtreRestreint: 'Action en mode privé',
  filtreHasIndicateurLies: 'Indicateur(s) associé(s)',
  filtreHasMesuresLiees: 'Actions avec mesure(s) des référentiels liée(s)',
  filtreHasBudget: 'Budget(s) renseigné(s)',
  actionRepeteTousLesAns: "L'action se répète tous les ans",
  filtreFinanceurIds: 'Financeur',
  filtrePartenaireIds: 'Partenaire',
  filtreCibles: 'Cible',
  filtreLibreTagsIds: 'Tags personnalisés',
  filtreInstanceGouvernanceIds: 'Instance de gouvernance',
  filtreStructurePiloteIds: 'Structure pilote',
  filtreFicheIds: 'Action',
  filtreLinkedFicheIds: 'Action liée',
  filtreSharedWithCollectivites:
    "Action mutualisée avec d'autres collectivités",
  filtreActionsMutualiseesPlusieursPlans:
    'Actions mutualisées dans plusieurs plans',
  filtreHasAtLeastBeginningOrEndDate: 'Date de début ou de fin renseignée',
  filtreHasDateDeFinPrevisionnelle: 'Date de fin prévisionnelle renseignée',
  filtreNoTag: 'Sans tags personnalisés',
  filtreNotes: 'Notes',
  filtreAnneesNotes: 'Année(s) de notes',
  filtreIndicateurIds: 'Indicateur(s)',
  filtreNoDescription: 'Sans description',

  typePeriodeCreation: 'de création',
  typePeriodeModification: 'de modification',
  typePeriodeDebut: 'de début',
  typePeriodeFin: 'de fin prévisionnelle',

  optionDateRenseignee: 'Date renseignée',
  optionDateNonRenseignee: 'Date non renseignée',
  optionActionsAvecIndicateurs: 'Actions avec indicateurs',
  optionActionsSansIndicateurs: 'Actions sans indicateurs',
  optionActionsAvecNotes: 'Actions avec notes',
  optionActionsSansNotes: 'Actions sans notes',
  optionActionsAvecNotesRecentes: 'Actions avec notes récentes (< 1 an)',
  optionActionsSansNotesRecentes: 'Actions sans notes récentes (> 1 an)',
  optionAvecMesuresLiees: 'Avec mesures liées',
  optionSansMesuresLiees: 'Sans mesures liées',
  optionActionsAvecBudget: 'Actions avec budget',
  optionActionsSansBudget: 'Actions sans budget',

  /** Actions */
  lierIndicateurExistant: 'Lier un indicateur existant',
  lierMesureReferentiels: 'Lier une mesure des référentiels',
  rechercherIndicateurPlaceholder: 'Rechercher par mots clés',
  rechercherParNomOuDescription: 'Rechercher par nom ou description',
  ajouterFinanceur: 'Ajouter un financeur',
  supprimerFinanceur: 'Supprimer le financeur',
  ajouterBudget: 'Ajouter un budget',
  supprimerBudget: 'Supprimer le budget',
  gererDroitsAcces: "Gérer les droits d'accès",
  dissocierAction: "Dissocier l'action",
};
