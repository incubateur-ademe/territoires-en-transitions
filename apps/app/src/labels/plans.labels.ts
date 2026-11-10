import {
  StatutFigeantJauge,
  PLAN_CREATION_DISABLED_MESSAGES,
  PlanCreationDisabledReason,
  OrigineSecteurs,
  SecteurReglementaire,
} from '@tet/domain/plans';
import { plural } from '@tet/ui/labels/plural';

type PlanBudgetCalculArgs = {
  nbFiches: number;
  totalFiches: number | undefined;
};

const planBudgetCalculInfo = ({
  nbFiches,
  totalFiches,
}: PlanBudgetCalculArgs): string =>
  `Le budget total est calculé sur la base de ${nbFiches}/${totalFiches} actions.\nLes actions sans budget dépensé HT renseigné ne sont pas incluses dans ce calcul.`;

export const plansLabels = {
  /** Plan */
  plan: plural({ one: 'plan', other: 'plans' }),
  nomPlan: 'Nom du plan',
  nomPlanRequis: 'Le nom du plan est requis',
  nomPlanTropLong: 'Le nom du plan ne doit pas dépasser 300 caractères',
  typePlan: 'Type de plan',
  planCreationDisabled: (reason: PlanCreationDisabledReason): string =>
    PLAN_CREATION_DISABLED_MESSAGES[reason],
  type: 'Type',
  axe: plural({ one: 'axe', other: 'axes' }),
  sousAxe: plural({ one: 'sous-axe', other: 'sous-axes' }),
  planBudgetCalculInfo,
  planBudgetCalculSansFichesRestreintesInfo: (
    args: PlanBudgetCalculArgs
  ): string =>
    `${planBudgetCalculInfo(
      args
    )}\nLes actions en accès restreint ne sont pas incluses non plus.`,
  planBudgetACompleterInfo:
    'Complétez les budgets dépensés HT dans les actions pour voir le total ici.',
  planBudgetAucunVisibleInfo:
    "Aucun budget dépensé HT n'est visible pour le moment.\nLes actions en accès restreint ne sont pas incluses.",

  sansPlanCardTitle: 'Aucun plan renseigné !',
  sansPlanCardDescription:
    'Ajouter un plan sur la plateforme vous permet de piloter vos actions.',
  sansPlanCardDescriptionSecondLine:
    "Vous pouvez intégrer n'importe quel plan thématique, déjà approuvé ou en cours d'élaboration.",

  /** Tableau de bord */
  tdbCreationModulePersonnalise1: 'Étape 1/2 : Paramétrer un module',
  tdbCreationModulePersonnalise2:
    'Étape 2/2 : Choisir les conditions applicables aux actions',

  /** Action */
  action: plural({ one: 'action', other: 'actions' }),
  ficheNavigation: 'Navigation entre les actions du plan',
  ficheNavigationPrecedente: 'Action précédente',
  ficheNavigationSuivante: 'Action suivante',

  sousAction: plural({ one: 'sous-action', other: 'sous-actions' }),
  sousActionSupprimer: 'Supprimer la sous-action',
  sousActionAjouter: 'Ajouter une sous-action',

  ficheStatut: 'Statut',
  ficheJauge: 'Avancement',
  ficheJaugeNonRenseignee: '–\u00a0%',
  ficheJaugeInfo: "À 100 %, l'action passe automatiquement au statut",
  ficheJaugeFigeeTitre: 'Avancement figé',
  ficheJaugeFigee: {
    Abandonné:
      "L'action est abandonnée. Changer de statut pour modifier la barre.",
    'En pause':
      "L'action est en pause. Changer de statut pour modifier la barre.",
    Bloqué: "L'action est bloquée. Changer de statut pour modifier la barre.",
  } satisfies Record<StatutFigeantJauge, string>,
  ficheJaugeSousActionsRealisees: ({
    realisees,
    total,
  }: {
    realisees: number;
    total: number;
  }): string =>
    `${realisees}/${total} sous-actions réalisées, à titre indicatif`,
  ficheJaugeMiseAJour: (date: string): string => `Mis à jour le ${date}`,
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
  ficheSecteursReglementaires: 'Secteurs réglementaires',
  ficheSecteursNonAttribuable: 'Non attribuable',
  ficheSecteursEnCoursDeCalcul: 'En cours de calcul',
  ficheSecteursARenseigner: 'À renseigner',
  ficheSecteursNonRenseigne: 'Non renseigné',
  ficheSecteursChargement: 'Chargement des secteurs',
  planSecteursARenseignerBouton: ({ count }: { count: number }) =>
    `Secteurs réglementaires à renseigner (${count})`,
  planSecteursVerifierTitre: 'Vérifier les secteurs',
  planSecteursGroupeARenseigner: 'À renseigner',
  planSecteursPosition: ({ index, total }: { index: number; total: number }) =>
    `${index} sur ${total}`,
  planSecteursRetourListe: 'Retour à la liste',
  planSecteursNonAttribuable: 'Non attribuable',
  planSecteursEnregistrerEtSuivante: 'Enregistrer et passer à la suivante',
  planSecteursEnregistrer: 'Enregistrer',
  planSecteursToutRenseigneTitre: 'Tout est traité',
  planSecteursToutRenseigne:
    'Toutes les actions ont maintenant un secteur réglementaire associé.',
  planSecteursTousRenseignesToast:
    'Tous les secteurs réglementaires du plan sont renseignés.',
  planSecteurARenseignerPastille: 'Secteur à renseigner',
  planSecteursManquantsTitre:
    'Renseigner les secteurs réglementaires manquants',
  planSecteursManquantsIa: ({ count }: { count: number }) =>
    `L’IA n’a pas pu classer ${plural({ one: 'action', other: 'actions' })({
      count,
    })}. Choisissez leur secteur dans le panneau de droite.`,
  planSecteursManquantsAutres: ({ count }: { count: number }) =>
    `Notre IA n’a pas pu classer ${plural({ one: 'action', other: 'actions' })({
      count,
    })}. Choisissez leur secteur dans le panneau de droite.`,
  planSecteursTousRenseignes:
    'Toutes les actions ont un secteur réglementaire.',
  planSecteursRenseignerManquants: ({ count }: { count: number }) =>
    count > 1
      ? `Renseigner les ${count} secteurs manquants`
      : 'Renseigner le secteur manquant',
  planSecteursErreurChargement:
    'Impossible de charger les actions à renseigner',
  planSecteursLectureSeule: 'Vous ne pouvez pas modifier cette action',
  planSecteursOuvrirFiche: "Ouvrir l'action",
  ficheSecteursOrigineLabels: {
    automatique: 'Secteurs proposés automatiquement',
    manuelle: 'Secteurs choisis par la collectivité',
    import_ia: "Secteurs proposés par l'import du plan, d'après le document",
  } satisfies Record<Exclude<OrigineSecteurs, 'indisponible'>, string>,
  ficheSecteurReglementaireLabels: {
    residentiel: 'Résidentiel',
    tertiaire: 'Tertiaire',
    transport_routier: 'Transport routier',
    autres_transports: 'Autres transports',
    agriculture: 'Agriculture',
    dechets: 'Déchets',
    industrie_hors_branche_energie: 'Industrie hors branche énergie',
    branche_energie: 'Branche énergie',
  } satisfies Record<SecteurReglementaire, string>,
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
  ficheOptions: "Plus d'options",
  ficheEmplacements: 'Emplacements',
  ficheDerniereModification: 'Dernière modification',
  actionNonClassee: 'Action non classée',
  actionIssueActionsAImpact: 'Action issue du service Actions à Impact',
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
  filtreNoReferent: 'Sans personne élue référente',
  filtreNoStatut: 'Sans statut',
  filtreNoPriorite: 'Sans niveau de priorité',
  filtreTypePeriode: 'Période appliquée à la date',
  filtreDebutPeriode: 'Du',
  filtreFinPeriode: 'Au',
  filtreRestreint: 'Action en mode privé',
  filtreHasIndicateurLies: 'Indicateurs liés',
  filtreHasMesuresLiees: 'Mesures des référentiels liées',
  filtreHasBudget: 'Budgets renseignés',
  actionRepeteTousLesAns: 'Action se répète tous les ans',
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
    'Action mutualisée dans plusieurs plans',
  filtreHasAtLeastBeginningOrEndDate: 'Date de début ou de fin',
  filtreHasDateDeFinPrevisionnelle: 'Date de fin prévisionnelle',
  filtreNoTag: 'Sans tags personnalisés',
  filtreNoThematique: 'Sans thématique',
  filtreNotes: 'Notes',
  filtreAnneesNotes: 'Années de notes',
  filtreIndicateurIds: 'Indicateurs',
  filtreNoDescription: 'Sans description',

  typePeriodeCreation: 'de création',
  typePeriodeModification: 'de modification',
  typePeriodeDebut: 'de début',
  typePeriodeFin: 'de fin prévisionnelle',

  optionDateRenseignee: 'Date renseignée',
  optionDateNonRenseignee: 'Date non renseignée',
  optionActionsAvecIndicateurs: 'Actions avec indicateurs liés',
  optionActionsSansIndicateurs: 'Actions sans indicateurs liés',
  optionActionsAvecNotes: 'Actions avec notes',
  optionActionsSansNotes: 'Actions sans notes',
  optionActionsAvecNotesRecentes: 'Actions avec notes récentes (< 1 an)',
  optionActionsSansNotesRecentes: 'Actions sans notes récentes (> 1 an)',
  optionAvecMesuresLiees: 'Avec mesures liées',
  optionSansMesuresLiees: 'Sans mesures liées',
  optionActionsAvecBudget: 'Actions avec budget',
  optionActionsSansBudget: 'Actions sans budget',

  /** Actions utilisateur */
  editerPlan: 'Éditer ce plan',
  supprimerPlan: 'Supprimer le plan',
  dupliquerPlan: 'Dupliquer le plan',

  creerAxe: 'Créer un axe',
  editerAxe: 'Éditer cet axe',
  deplacerAxe: 'Déplacer cet axe',
  supprimerAxe: 'Supprimer cet axe',
  deplierTousLesAxes: 'Déplier tous les axes',
  replierTousLesAxes: 'Replier tous les axes',
  lierIndicateurs: 'Lier des indicateurs',
  ajouterNouveauTitreAxe: 'Ajouter un nouveau titre/axe',

  creerAction: 'Créer une action',
  dissocierAction: "Dissocier l'action",
  lierLAction: "Lier l'action",
  lierIndicateurExistant: 'Lier un indicateur existant',
  lierMesureReferentiels: 'Lier une mesure des référentiels',
  rechercherIndicateurPlaceholder: 'Rechercher par mots clés',
  rechercherParNomOuDescription: 'Rechercher par nom ou description',
  ajouterFinanceur: 'Ajouter un financeur',
  supprimerFinanceur: 'Supprimer le financeur',
  ajouterBudget: 'Ajouter un budget',
  supprimerBudget: 'Supprimer le budget',
  gererDroitsAcces: "Gérer les droits d'accès",

  ajouterModulePersonnalise: 'Ajouter un module personnalisé',
  modifierModulePersonnalise: 'Modifier un module personnalisé',

  /** Création et import de plan */
  ajouterPlan: 'Ajouter un plan',
  creerPlan: 'Créer un plan',
  creerPlanSousTitre: 'directement sur la plateforme',
  importPlanSupportSousTitre: 'en envoyant votre document à notre équipe',
  importPlanSupportEnvoyez: 'Envoyez-nous votre document (PDF ou Excel) via le',
  importPlanSupportChat: 'chat en ligne',
  importPlanSupportOuAdresse: 'ou à l’adresse',
  importPlanSupportEmail: 'contact@territoiresentransitions.fr',
  importPlanSupportPriseEnCharge:
    'Notre équipe se chargera de l’importer pour vous sur la plateforme.',
  importPlanIaContact:
    'L’import ne vous convient pas ? Contactez-nous via le live chat en joignant votre fichier et quelques mots de contexte, cela nous aide à l’améliorer.',
  importPlanIaFormatsAcceptes:
    'PDF, Word (.docx), Excel (.xlsx) ou CSV, 25 Mo maximum',
  importPlanIaFichierSuggere:
    "Programme d'actions déposé à l'étape Documents, pré-sélectionné pour vous.",
  importPlanIaFichierSuggereChargement:
    "Récupération du programme d'actions déposé…",
  importPlanIaRetirerFichier: 'Retirer',
  importPlanIaTypeVerrouille:
    "Un plan lié au programme d'actions du PCAET est nécessairement de ce type.",
  importPlanIaPlanImporte: 'Plan importé',
  importPlanIaEnCoursCourt: 'Import en cours',
  importPlanIaEtapeSecteurs:
    'Identification des secteurs et des effets attendus',
  importPlanIaEtapeEffetsAttendus: 'Identification des effets attendus',
  importPlanIaEtapesTitre: "Étapes de l'import",
  importPlanIaEtapesSimplifiees: {
    lecture: 'Lecture du document',
    structure: 'Détection des axes et sous-axes',
    actions: 'Création des actions',
    secteurs: 'Attribution des secteurs réglementaires',
  },
  importPlanIaEtapeSimplifieeEffetsAttendus:
    'Identification des effets attendus',
  importPlanIaEtapeTerminee: 'terminée',
  importPlanIaEtapeEnCours: 'en cours',
  importPlanIaEtapeEnAttente: 'en attente',
  importPlanIaEtapeEnEchec: 'en échec',
  importPlanIaEchecCourt: "Échec de l'import",
  importPlanIaReprendre: "Reprendre l'import",
  importPlanIaRepriseLancee: 'Import repris depuis sa dernière étape terminée',
  importPlanIaEchecDescription:
    "L'import de ce plan a échoué : supprimez-le, puis relancez l'import.",
  importPlanIaEnCoursDescription:
    "Ce plan est en cours d'import : il sera accessible une fois l'import terminé.",
  importPlanIaSupprimerPlanEchoue: 'Supprimer',
  importPlanIaDejaImporteTitre: 'Ce fichier a déjà été importé',
  importPlanIaDejaImporteDescription: ({
    date,
    planNom,
  }: {
    date: string;
    planNom: string;
  }) =>
    `Il a été importé le ${date} dans le plan « ${planNom} », toujours présent. Relancer l'import créera un second plan.`,
  importPlanIaRelancerQuandMeme: "Relancer l'import quand même",
  planImporteSupportQuestion:
    'Le plan proposé ne vous convient pas ? Vous avez besoin d’aide ? Contactez-nous via le',
  planImporteSupportLien: 'support en ligne',
  planImporteSupportOuAdresse: '(ou à l’adresse',
  planImporteSupportFin: ').',
  planImporteBandeauTitre: ({ etapes }: { etapes: number }) =>
    etapes > 1
      ? `Plan généré par l’IA : ${etapes} étapes avant de le valider`
      : 'Plan généré par l’IA : vérifiez-le avant de le valider',
  planImporteEtapeStructureTitre:
    'Vérifier la structure globale du plan puis le valider',
  planImporteEtapeStructureDescription:
    'Vérifiez la structure globale de votre plan (axes et sous-axes), corrigez-la si besoin, puis validez le plan.',
  planImporteValider: 'Valider le plan',
  planImporteValide: 'Plan validé.',
  planRevenirALaDemarche: 'Revenir à la démarche',
  planImporteValidationErreur: 'La validation du plan a échoué',

  planOngletPilotage: 'Pilotage Plan',
  planOngletSuivi: 'Suivi Avancement',
  suiviPlanACeJour: 'à ce jour',
  planFiltreSuivi: 'Suivi',
  suiviPlanFiltresBloc: "Les filtres s'appliquent uniquement à ce bloc",
  suiviPlanThematiques: 'Thématiques',
  suiviPlanReinitialiserFiltres: 'Réinitialiser les filtres',
  suiviPlanNbActions: plural({ one: 'action', other: 'actions' }),
  suiviPlanAvancementInfoPlan:
    "Moyenne de l'avancement de toutes les actions qui composent le plan, calculé à partir de leur statut et de leur jauge :",
  suiviPlanAvancementInfoAxe:
    "Moyenne de l'avancement de toutes les actions qui composent l'axe ou le sous-axe, calculé à partir de leur statut et de leur jauge :",
  suiviPlanAvancementInfoRegles: [
    { statut: 'Réalisé', valeur: ' = 100\u00a0%' },
    { statut: 'À venir', valeur: ' = 0\u00a0%' },
    {
      statut: 'Autres statuts',
      valeur: ' = valeur de la jauge (0\u00a0% si non renseignée).',
    },
  ],
  suiviPlanAvancementInfoExclusions:
    'Les actions abandonnées sont exclues. Les jauges peuvent être impactées par le fait que des actions soient récurrentes.',
  vueEnsembleTitre: "Vue d'ensemble",
  vueEnsembleAvancement: 'Avancement du plan',
  vueEnsembleBaseCalcul: ({
    total,
    abandonnees,
  }: {
    total: number;
    abandonnees: number;
  }): string =>
    `Sur ${total - abandonnees} actions, hors ${abandonnees} abandonnée(s).`,
  vueEnsembleEnCoursSansAvancement: (count: number): string =>
    `${count} ${
      count > 1
        ? 'actions en cours sans avancement renseigné, comptées'
        : 'action en cours sans avancement renseigné, comptée'
    } à 0 %.`,
  vueEnsembleRenseigner: 'Renseigner',
  vueEnsembleRepartitionParStatut: 'Répartition par statut',
  vueEnsembleRepartitionInfo:
    'Cliquer sur un statut ouvre les actions concernées dans le pilotage.',
  vueEnsembleTrancher: 'Trancher',
  vueEnsembleArbitrer: 'Arbitrer',
  vueEnsembleDebloquer: 'Débloquer',
  avancementParAxeTitre: 'Avancement par axe',
  avancementParAxeRealisees: plural({ one: 'réalisée', other: 'réalisées' }),
  avancementParAxeAfficherSousAxes: 'Afficher les sous-axes',
  avancementParAxeMasquerSousAxes: 'Masquer les sous-axes',
  avancementParAxeVoirPlus: (count: number): string =>
    `Voir plus (${count} ${count > 1 ? 'axes' : 'axe'})`,
  avancementParAxeVoirMoins: 'Voir moins',
  avancementParAxeAucunAxe: "Ce plan n'a pas encore d'axe.",
  evolutionStatutsTitre: 'Évolution des statuts sur la période',
  evolutionStatutsPeriodeTitre: ({
    debut,
    fin,
  }: {
    debut: string;
    fin: string | null;
  }): string => `${debut} → ${fin ?? "aujourd'hui"}`,
  evolutionStatutsPeriode: 'Période',
  evolutionStatutsDebutAnnee: "Depuis le début de l'année",
  evolutionStatutsDernierMois: 'Dernier mois',
  evolutionStatutsDerniersMois: (count: number): string =>
    `${count} derniers mois`,
  evolutionStatutsDernieresAnnees: (count: number): string =>
    `${count} dernières années`,
  evolutionStatutsDebutPlan: 'Depuis le début du plan',
  evolutionStatutsPersonnalisee: 'Période personnalisée',
  evolutionStatutsDu: 'Du',
  evolutionStatutsAu: 'Au',
  evolutionStatutsAujourdhui: "Aujourd'hui",
  evolutionStatutsStatutsAu: (date: string | null): string =>
    date ? `Statuts au ${date}` : "Statuts aujourd'hui",
  evolutionStatutsExistaient: (total: number): string =>
    `${total} ${
      total > 1 ? 'actions existaient' : 'action existait'
    } à cette date`,
  evolutionStatutsCreees: ({
    total,
    creees,
    date,
  }: {
    total: number;
    creees: number;
    date: string;
  }): string =>
    `${total} ${
      total > 1 ? 'actions' : 'action'
    } (+${creees} créée(s) depuis le ${date})`,
  evolutionStatutsHistoriqueRamene:
    'Historique disponible depuis décembre 2023 : la comparaison part du 11/12/2023.',
  evolutionStatutsInclureActionsContinues:
    'Inclure les actions continues (qui se répètent chaque année)',
  evolutionStatutsActionsContinuesInfo: (count: number): string =>
    `${count} action(s) continue(s) dans le plan. Leur statut reste souvent « En cours » par nature : les exclure évite de fausser l'évolution.`,
  evolutionStatutsStatut: 'Statut',
  evolutionStatutsEvolution: 'Évolution',
  evolutionStatutsTotal: 'Total',
  evolutionStatutsPeriodeInvalide:
    'La date de début doit précéder la date de fin.',
  evolutionStatutsErreurChargement:
    "Impossible de charger l'évolution des statuts",
  faireAvancerLePlanTitre: 'Fiabiliser le suivi',
  faireAvancerLePlanDescription:
    'Certaines actions pourraient impacter négativement le suivi. Les traiter rend les chiffres ci-dessus fiables avant votre prochain COPIL.',
  faireAvancerLePlanNonExporte: "Non inclus dans l'export",
  faireAvancerLePlanVoirLesActions: 'Voir les actions',
  faireAvancerLePlanRenseignerAvancement: "Renseigner l'avancement",
  renseignerAvancementSousTitre:
    "Actions « En cours » dont la jauge n'a jamais été renseignée",
  renseignerAvancementMiseAJour: (date: string): string =>
    `dernière mise à jour le ${date}`,
  renseignerAvancementAucuneAction: 'Aucune action à renseigner.',
  renseignerAvancementJauge: (titre: string): string =>
    `Avancement de ${titre}`,
  faireAvancerLePlanEnCoursSansAvancement: (count: number): string =>
    `${
      count > 1 ? 'actions' : 'action'
    } « En cours » sans avancement renseigné`,
  faireAvancerLePlanEnCoursSansAvancementInfo:
    "Elles comptent pour 0 % dans l'avancement du plan.",
  faireAvancerLePlanNonModifiees: (count: number): string =>
    `${count > 1 ? 'actions' : 'action'} sans mise à jour depuis plus d'un an`,
  faireAvancerLePlanNonModifieesInfo:
    "Elles n'ont peut-être plus un statut ou un avancement à jour. Hors actions réalisées, abandonnées, en pause ou bloquées.",
  faireAvancerLePlanADecider: (count: number): string =>
    `${count > 1 ? 'actions' : 'action'} en retard, ${
      count > 1 ? 'bloquées' : 'bloquée'
    } ou à discuter`,
  faireAvancerLePlanADeciderInfo:
    'Elles attendent une décision : trancher, replanifier ou débloquer.',
  faireAvancerLePlanSansPilote: (count: number): string =>
    `${count > 1 ? 'actions' : 'action'} sans personne pilote`,
  faireAvancerLePlanSansPiloteInfo:
    "Elles n'ont pas de responsable désigné pour les faire avancer.",
} as const;
