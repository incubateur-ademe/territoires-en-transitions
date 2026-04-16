import { countedPlural, plural } from '@tet/ui/labels/plural';

export const appLabels = {
  referentielCae: 'Climat Air Énergie',
  referentielEci: 'Économie Circulaire',
  referentielCrte: 'Contrat Relance Transition Écologique',
  referentielTe: 'Transition Écologique',
  referentielTeTest: 'Transition Écologique (test)',

  nonRenseigne: 'Non renseigné',
  avancementFait: 'Fait',
  avancementPasFait: 'Pas fait',
  avancementDetaille: 'Détaillé au %',
  avancementDetailleALaTache: 'Détaillé à la tâche',
  avancementProgramme: 'Programmé',
  avancementNonConcerne: 'Non concerné',

  actionCae3: 'Énergie, eau, assainissement',
  actionEci1: 'Stratégie globale',
  actionEci2: 'Réduction, collecte et valorisation des déchets',
  actionEci3: "Autres piliers de l'ECI",
  actionEci4: 'Outils financiers',

  membreFonctionTechnique: 'Directions et services techniques',
  membreFonctionPolitique: 'Équipe politique',
  membreFonctionConseiller: "Bureau d'études",
  membreFonctionPartenaire: 'Partenaire',

  membreTeteFonctionTechnique: 'Chef·fe de projet',
  membreTeteFonctionPolitique: 'Élu·e',
  membreTeteFonctionConseiller: 'Conseiller·ère',
  membreTeteFonctionPartenaire: 'Partenaire',

  actionTypeAction: 'mesure',
  actionTypeSousAction: 'sous-mesure',
  actionTypeTache: 'tâche',
  actionTypeReferentiel: 'référentiel',
  actionTypeAxe: 'axe',
  actionTypeSousAxe: 'sous-axe',
  actionTypeExemple: 'exemple',

  phaseBases: "S'engager",
  phaseMiseEnOeuvre: 'Concrétiser',
  phaseEffets: 'Consolider',

  etoilePremiere: 'première',
  etoileDeuxieme: 'deuxième',
  etoileTroisieme: 'troisième',
  etoileQuatrieme: 'quatrième',
  etoileCinquieme: 'cinquième',

  sourceTypeObjectif: 'objectifs',
  sourceTypeResultat: 'résultats',

  indicateurPersonnaliseSingulier: 'Indicateur personnalisé',
  indicateurPersonnalisePluriel: 'Indicateurs personnalisés',
  indicateurFavoriSingulier: 'Indicateur favori',
  indicateurFavoriPluriel: 'Indicateurs favoris',
  indicateurFavoriTooltip: 'Indicateurs favoris de la collectivité',
  indicateurCleSingulier: 'Indicateur clé',
  indicateurClePluriel: 'Indicateurs clés',
  indicateurPriveSingulier: 'Indicateur privé',
  indicateurPrivePluriel: 'Indicateurs privés',
  indicateurMonSingulier: 'Mon indicateur',
  indicateurMonPluriel: 'Mes indicateurs',
  indicateurMonTooltip: 'Indicateurs dont je suis la personne pilote',
  indicateurTousSingulier: 'Indicateur',
  indicateurTousPluriel: 'Tous les indicateurs',

  roleAdmin: 'Admin',
  roleEdition: 'Éditeur',
  roleContributeur: 'Contributeur',
  roleLecteur: 'Lecteur',
  roleAdminDescription:
    'Peut entièrement configurer, éditer, et inviter de nouveaux membres',
  roleEditionDescription: 'Peut éditer',
  roleContributeurDescription:
    'Peut éditer uniquement les actions & indicateurs dont il est le pilote',
  roleLecteurDescription: 'Peut uniquement consulter',

  auditNonAudite: 'Non audité',
  auditEnCours: 'Audit en cours',
  auditAudite: 'Audité',

  filtreAxesId: 'Axes',
  filtreSort: 'Tri',
  eluReferent: 'Élu·e référent·e',
  statut: 'Statut',
  filtreNoPilote: 'Sans pilote',
  filtreNoReferent: 'Sans référent',
  filtreNoStatut: 'Sans statut',
  filtreNoPlan: 'Sans plan',
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
  filtreNoServicePilote: 'Sans direction ou service pilote',
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
  filtreNoObjectif: 'Sans objectif',

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

  cibleGrandPublic: 'Grand public',
  cibleAssociations: 'Associations',
  ciblePublicScolaire: 'Public Scolaire',
  cibleActeursEconomiques: 'Acteurs économiques',
  cibleActeursEconomiquesPrimaire: 'Acteurs économiques du secteur primaire',
  cibleActeursEconomiquesSecondaire:
    'Acteurs économiques du secteur secondaire',
  cibleActeursEconomiquesTertiaire: 'Acteurs économiques du secteur tertiaire',
  ciblePartenaires: 'Partenaires',
  cibleAutresCollectivites: 'Autres collectivités du territoire',
  cibleCollectiviteElleMeme: 'Collectivité elle-même',
  cibleElusLocaux: 'Elus locaux',
  cibleAgents: 'Agents',

  statutAVenir: 'À venir',
  statutADiscuter: 'À discuter',
  statutEnCours: 'En cours',
  statutRealise: 'Réalisé',
  statutEnRetard: 'En retard',
  statutEnPause: 'En pause',
  statutAbandonne: 'Abandonné',
  statutBloque: 'Bloqué',

  prioriteEleve: 'Élevé',
  prioriteMoyen: 'Moyen',
  prioriteBas: 'Bas',

  modifiedSinceLast15: 'les 15 derniers jours',
  modifiedSinceLast30: 'les 30 derniers jours',
  modifiedSinceLast60: 'les 60 derniers jours',
  modifiedSinceLast90: 'les 90 derniers jours',

  participationPas: 'Pas de participation citoyenne',
  information: 'Information',
  participationConsultation: 'Consultation',
  participationConcertation: 'Concertation',
  participationCoConstruction: 'Co-construction',

  historiqueActionStatut: 'Mesure : statut',
  historiqueActionPrecision: 'Mesure : texte',
  historiqueReponse: 'Caractéristique de la collectivité : réponse',
  historiqueJustification: 'Caractéristique de la collectivité : justification',

  populationMoins20000: 'Moins de 20 000',
  population20000_50000: '20 000 - 50 000',
  population50000_100000: '50 000 - 100 000',
  population100000_200000: '100 000 - 200 000',
  populationPlus200000: 'Plus de 200 000',
  realiseCourant0_34: '0 à 34 %',
  realiseCourant35_49: '35 à 49 %',
  realiseCourant50_64: '50 à 64 %',
  realiseCourant65_74: '65 à 74 %',
  realiseCourant75_100: '75 à 100 %',
  tauxRemplissage0: '0 %',
  tauxRemplissage0_49: '1 à 49 %',
  tauxRemplissage50_79: '50 à 79 %',
  tauxRemplissage80_99: '80 à 99 %',
  tauxRemplissage100: '100 %',
  niveauLabellisationNon: 'Non labellisé',
  niveauLabellisation1: 'Première étoile',
  niveauLabellisation2: 'Deuxième étoile',
  niveauLabellisation3: 'Troisième étoile',
  niveauLabellisation4: 'Quatrième étoile',
  niveauLabellisation5: 'Cinquième étoile',
  trierParRealiseCourant: '% Réalisé courant',
  tauxRemplissage: 'Taux de remplissage',
  ordreAlphabetique: 'Ordre alphabétique',
  typeCollectiviteCa: "Communauté d'agglomération",
  typeCollectiviteCc: 'Communauté de communes',
  typeCollectiviteCu: 'Communauté urbaine',
  commune: 'Commune',
  typeCollectiviteEpt: 'Établissement public territorial',
  typeCollectiviteMetro: 'Métropole',
  typeCollectivitePetr: "Pôle d'équilibre territorial rural",
  typeCollectivitePolem: 'Pôle métropolitain',
  typeCollectiviteSyndicat: 'Syndicat',
  typeCollectiviteSmf: 'Syndicat mixte fermé',
  typeCollectiviteSmo: 'Syndicat mixte ouvert',
  typeCollectiviteSivu: 'Syndicat intercommunal à vocation unique',
  typeCollectiviteSivom: 'Syndicat intercommunal à vocations multiples',
  departement: 'Département',
  region: 'Région',

  description: 'Description',
  planOptionGraphiqueIndicateurs: 'Graphique des indicateurs',

  indicateurSortCompletude: 'Complétude',

  sourceSnbc: 'Objectifs SNBC',
  sourcePcaet: 'Objectifs Territoires & Climat',
  sourceOpendata: 'Résultats Open data',
  sourceCollectivite: 'Données de la collectivité',
  sourceMoyenne: 'Moyenne des collectivités de même type',
  sourceCible: 'Valeur cible',
  sourceSeuil: 'Valeur limite',

  formatExcel: 'Format Excel (.xlsx)',
  formatOpenDocument: 'Format OpenDocument (.ods)',

  budgetInvestissement: "Budget d'investissement : ",
  budgetFonctionnement: 'Budget de fonctionnement : ',
  budgetCompleterInvestissement: "Compléter le budget d'investissement",
  budgetCompleterFonctionnement: 'Compléter le budget de fonctionnement',
  tableauMontant: 'Montant',
  tableauDepense: 'Dépensé',
  budgetEtpReel: 'ETP réel',
  budgetEtpPrevisionnel: 'ETP prévisionnel',
  financeurMontantSubventionObtenu: 'Montant de subvention obtenu',
  completionTitre: 'titre',
  completionDescription: 'description',
  completionStatut: 'statut',
  completionPilote: 'pilote',

  ajouter: 'Ajouter',
  annuler: 'Annuler',
  confirmer: 'Confirmer',
  selectionner: 'Sélectionner',
  valider: 'Valider',
  fermer: 'Fermer',
  modifier: 'Modifier',
  supprimer: 'Supprimer',
  telecharger: 'Télécharger',
  enregistrer: 'Enregistrer',

  erreurConnexionReseau:
    "Erreur de connexion réseau. Veuillez attendre que votre connexion soit rétablie pour utiliser l'application.",

  pasDocumentAttenduAction:
    "Il n'y a pas de document attendu pour cette action du référentiel.",
  pasDocumentAttenduSousAction:
    "Il n'y a pas de document attendu pour cette sous-action du référentiel.",
  documentsComplementaires: 'Documents complémentaires',
  documentsVisiblesAvertissement:
    'Tous les documents sont visibles par les membres de la communauté Territoires en Transitions, en dehors des documents confidentiels.',
  editerDocument: 'Éditer le document',
  editerLien: 'Éditer le lien',
  commenter: 'Commenter',
  supprimerDocument: 'Supprimer le document',
  documentModePrive: 'Document en mode privé',
  telechargerFichier: 'Télécharger le fichier',
  ouvrirLien: 'Ouvrir le lien',
  voirMoins: 'Voir moins',
  voirPlus: 'Voir plus',
  supprimerDocumentMessage:
    'Le document sera définitivement supprimé. Voulez-vous vraiment le supprimer ?',
  ajouterDocumentAttendu: 'Ajouter un document attendu',
  ajouterPreuve: 'Ajouter une preuve',
  ajouterDocumentComplementaire: 'Ajouter un document complémentaire',
  sousActionAssociee: 'Sous-action associée (obligatoire)',
  ajouterDocument: 'Ajouter un document',
  ajouterRapportAudit: "Ajouter le rapport d'audit",

  validationTitreLienRequis: 'Merci de renseigner un titre pour ce lien',
  validationLienValide: 'Merci de renseigner un lien valide',
  titreLienObligatoire: 'Titre (obligatoire)',
  lienObligatoire: 'Lien (obligatoire)',

  ajouterFichiers: 'Ajouter un ou plusieurs fichier(s)',

  tousLesFichiersCollectivite: 'Tous les fichiers de ma collectivité',
  rechercherParNom: 'Rechercher par nom',

  potentielReduitZero: 'Potentiel réduit : 0 point',
  potentielAugmente: ({ points }: { points: string }): string =>
    `Potentiel augmenté : ${points}`,
  potentielReduit: ({ points }: { points: string }): string =>
    `Potentiel réduit : ${points}`,
  potentiel: ({ points }: { points: string }): string =>
    `Potentiel : ${points}`,
  pointsFormates: ({
    formattedValue,
    count,
  }: {
    formattedValue: string;
    count: number;
  }): string =>
    `${formattedValue} ${count === 0 || count === 1 ? 'point' : 'points'}`,
  editerNomSauvegarde: "Éditer le nom d'une sauvegarde",
  nomDeLaSauvegarde: 'Nom de la sauvegarde',
  entrezNomSauvegarde: 'Entrez le nom de la sauvegarde',
  supprimerSauvegarde: 'Supprimer une sauvegarde figée du référentiel',
  supprimerSauvegardeDescription:
    'Cette sauvegarde sera définitivement supprimée. Êtes-vous sûr de vouloir supprimer cette sauvegarde du référentiel ?',

  auditCotSansLabellisation: 'Audit COT sans labellisation',
  auditCotAvecLabellisation: ({ asterique }: { asterique: string }): string =>
    `Audit COT avec labellisation${asterique}`,
  auditLabellisation: ({ asterique }: { asterique: string }): string =>
    `Audit de labellisation${asterique}`,
  envoiEnCours: 'Envoi en cours...',
  demandeEnvoyee: 'Demande envoyée',
  auditEnCoursParAuditeurs: ({
    listeAuditeurs,
  }: {
    listeAuditeurs: string;
  }): string => `Audit en cours, par ${listeAuditeurs}`,
  labellisationEnCoursParAuditeurs: ({
    listeAuditeurs,
  }: {
    listeAuditeurs: string;
  }): string => `Labellisation en cours - audité par ${listeAuditeurs}`,
  labellisationEnCours: 'Labellisation en cours',
  objectifRenouveler: 'Objectif : renouveler la labellisation',
  objectifEtoile: ({ etoileLabel }: { etoileLabel: string }): string =>
    `Objectif : ${etoileLabel} étoile`,
  demanderPremiereEtoile: 'Demander la première étoile',
  demanderAudit: 'Demander un audit',
  auditSansLabellisationMessage:
    "Suite à cette validation, et après vérification par l'équipe Territoires en Transitions, un nouveau cycle va démarrer avec le score validé par l'audit.",
  auditLabellisationMessage:
    "Suite à cette validation, plus aucune modification ne sera possible dans le cadre de l'audit et le secrétariat de la Commission nationale du label (CNL) sera notifié pour réceptionner le dossier de candidature complet et le transmettre aux membres de la CNL.",

  notesAuditeur: "Notes de l'auditeur, auditrice",
  notesAuditeurHint:
    "Remarques sur la mesure, questions pour la séance d'audit",
  ajouterMesureOrdreDuJour:
    "Ajouter cette mesure à l'ordre du jour de la séance d'audit",
  detaillerAvancementTache: "Détailler l'avancement à la tâche",
  detaillerAvancement: "Détailler l'avancement",
  detaillerAvancementPourcentage: "Détailler l'avancement au pourcentage",
  raisonRepartition:
    'Pour faciliter la relecture, vous pouvez préciser ici les raisons de cette répartition',
  pilotes: 'Pilotes',
  directionOuServicePilote: 'Direction ou service pilote',
  modifierAction: "Modifier l'action",
  personnePilote: 'Personne pilote',
  selectionnerOuCreerPilote: 'Sélectionner ou créer un pilote',
  dateDebut: 'Date de début',
  dateFin: 'Date de fin',

  supprimerSousAction: 'Supprimer la sous-action',
  dissocierAction: "Dissocier l'action",
  validerAudit: "Valider l'audit",
  validerAuditDescription:
    "Pour clôturer l'audit, merci de joindre votre rapport définitif (disponible dans la bibliothèque de documents et visible par les membres de la communauté).",
  rendreFichesPubliques: "Rendre public l'ensemble des actions",
  rendreFichesPrivees: "Rendre privé l'ensemble des actions",
  rendreFichesPriveesQuestion:
    'Souhaitez-vous rendre privées toutes les actions de ce plan ?',
  rendreFichesPubliquesQuestion:
    'Souhaitez-vous rendre publiques toutes les actions de ce plan ?',
  rendreFichesPriveesDescription:
    "En passant en privé l'ensemble des actions de ce plan, elles ne seront plus accessibles par les personnes n’étant pas membres de votre collectivité. Les actions restent consultables par l’ADEME et le service support de la plateforme.",
  rendreFichesPubliquesDescription:
    "En passant en public l'ensemble des actions de ce plan, elles seront accessibles à toutes les personnes n’étant pas membres de votre collectivité.",
  telechargerPlanExcel: 'Télécharger le plan (Excel)',
  telechargerPlanWord: 'Télécharger le plan (Word)',
  exporterEnPdf: 'Exporter en PDF',
  parametresExport: "Paramètres de l'export",
  personnaliserSection: 'Personnaliser la section',
  ajouterAExportPdf: 'Ajouter à l’export PDF',
  genererRapportPowerpoint: 'Générer un rapport (PowerPoint)',
  exportEnCours: 'Export en cours',
  generationEnCours: 'Génération en cours',
  supprimerPlan: 'Supprimer le plan',
  editerPlan: 'Éditer ce plan',
  modifierTitre: 'Modifier le titre',
  creerAxe: 'Créer un axe',
  descriptionsMasquees:
    "Les descriptions sont masquées dans l'affichage global",
  supprimerDescription: 'Supprimer la description',
  ajouterDescription: 'Ajouter une description',
  indicateursMasques: "Les indicateurs sont masqués dans l'affichage global",
  lierIndicateur: 'Lier un indicateur',
  associerIndicateurs: 'Associer des indicateurs',
  deplacer: 'Déplacer',
  editerAxe: 'Éditer cet axe',
  creerAction: 'Créer une action',
  ajouterNouveauTitreAxe: 'Ajouter un nouveau titre/axe',
  pasDActionNiArborescencePlan:
    "Vous n'avez aucune action ni arborescence de plan !",
  pasDActionNiArborescencePlanLecture:
    "Cette collectivité n'a pas encore d'action ni d'arborescence de plan",

  cePlan: 'ce plan',
  cetAxe: 'cet axe',
  souhaitezVousSupprimer: ({
    labelPlanOrAxe,
  }: {
    labelPlanOrAxe: string;
  }): string => `Souhaitez-vous supprimer ${labelPlanOrAxe} ?`,
  aucuneActionDans: ({ labelPlanOrAxe }: { labelPlanOrAxe: string }): string =>
    `Il n'y a aucune action dans ${labelPlanOrAxe} et son arborescence.`,
  attentionActionsLiees: ({
    labelPlanOrAxe,
  }: {
    labelPlanOrAxe: string;
  }): string =>
    `Attention : les actions liées à ${labelPlanOrAxe} seront également supprimées !`,
  actionsLieesAutrePlan:
    'Les actions liées à un autre plan ou mutualisées ne seront pas impactées.',

  mutualiserAction: "Mutualiser l'action dans un autre plan",
  gererDroitsAcces: "Gérer les droits d'accès de l'action",
  telechargerActionPdf: "Télécharger l'action (PDF)",
  journalActivite: "Journal d'activité",
  supprimerAction: "Supprimer l'action",

  actionSansTitre: 'Action sans titre',
  actionPartageeEntreMultiplePlans:
    'Cette action est partagée entre plusieurs plans et sera supprimée partout.',
  actionContientSousActions:
    'Cette action contient des sous-actions qui seront également supprimées.',

  partageeAvec: ({
    collectivitesText,
  }: {
    collectivitesText: string;
  }): string => `Partagée avec ${collectivitesText}`,
  actionAccesRestreint: 'Action en accès restreint',

  supprimerNote: 'Supprimer la note',
  noteCreeePar: ({ prenom, nom }: { prenom: string; nom: string }): string =>
    ` créée par ${prenom} ${nom}`,

  supprimerFinanceur: 'Supprimer le financeur',
  supprimerBudget: 'Supprimer le budget',
  ajouterBudget: 'Ajouter un budget',
  ajouterFinanceur: 'Ajouter un financeur',
  modifierTypeBudgetQuestion: 'Modifier le type de budget ?',
  modifierTypeBudgetAlerte: ({ nextMode }: { nextMode: string }): string =>
    `Attention : en passant au mode ${nextMode}, les données budgétaires actuelles seront supprimées.`,
  budgetAnnee: ({ year }: { year: number }): string => `Budget ${year}`,

  annulerInvitation: "Annuler l'invitation",
  invitationDescription:
    "Cette personne n'a pas encore créé de compte. Même si elle le fait, elle ne pourra pas contribuer dans l'espace de la collectivité.",
  renvoyerInvitation: "Renvoyer l'invitation",
  supprimerInvitation: "Supprimer l'invitation",
  associerCompteTag: 'Associer ce compte utilisateur à un tag',
  associerCompteTagDescription:
    'Vous pouvez associer ce compte utilisateur à un ou plusieurs tags afin que les actions, indicateurs et mesures des référentiels soient associés à cet utilisateur.',
  associerCompteTagChamp:
    'Associer ce compte utilisateur à un ou plusieurs tags',

  filtrerHistorique: "Filtrer l'historique des modifications par",
  aucunHistorique: 'Aucun historique de modification',
  voirAction: "Voir l'action",
  par: 'Par',
  referentiel: 'Référentiel',
  masquerDetail: 'Masquer le détail',
  afficherDetail: 'Afficher le détail',
  typeElementModifie: "Type d'élément modifié",
  membre: 'Membre',

  historiqueResultats: ({ count }: { count: number }): string =>
    count <= 1 ? `${count} résultat` : `${count} résultats`,

  collectivitesActives: ({ count }: { count: number }): string =>
    count <= 1 ? 'collectivité active' : 'collectivités actives',
  plan: ({ count }: { count: number }): string =>
    count <= 1 ? 'plan' : 'plans',

  visiteEffectuee: ({ dateVisite }: { dateVisite: string }): string =>
    `Visite effectuée le ${dateVisite}`,

  navTableauxDeBord: 'Tableaux de bord',
  navTableauDeBordSynthetique: 'Tableau de bord synthétique',
  navTableauDeBord: 'Tableau de bord',
  navMonSuiviPersonnel: 'Mon suivi personnel',
  navPlansEtActions: 'Plans & Actions',
  plans: 'Plans',
  actions: 'Actions',
  navActionsAImpact: 'Actions à Impact',
  indicateurs: 'Indicateurs',
  navListesIndicateurs: "Listes d'indicateurs",
  trajectoireSnbcEtObjectifs: 'Trajectoire SNBC et objectifs',
  navEtatDesLieux: 'État des lieux',
  navTableauDeBordEtatDesLieux: 'Tableau de bord État des Lieux',
  navReferentielClimatAirEnergie: 'Référentiel Climat-Air-Énergie',
  navLabellisationClimatAirEnergie: 'Labellisation Climat-Air-Énergie',
  navReferentielEconomieCirculaire: 'Référentiel Économie Circulaire',
  navLabellisationEconomieCirculaire: 'Labellisation Économie Circulaire',
  navReferentielTransitionEcologique: 'Référentiel Transition Écologique',
  navParametres: 'Paramètres',
  navMaCollectivite: 'Ma collectivité',
  navGestionDesUtilisateurs: 'Gestion des utilisateurs',
  navBibliothequeDeDocuments: 'Bibliothèque de documents',
  navCollectivites: 'Collectivités',
  navSuperAdmin: 'Super Admin',
  navImporterUnPlan: 'Importer un plan',
  ajouterCollectivite: 'Ajouter une collectivité',
  modifierCollectivite: 'Modifier la collectivité',
  navAffichageReferentiels: 'Affichage des référentiels',
  navFinaliserInscription: 'Finaliser mon inscription',
  navAide: 'Aide',
  navProfil: 'Profil',
  navDeconnexion: 'Déconnexion',

  formChercherCollectivite: 'Chercher la collectivité',
  formChercherInsee: "Cherche la collectivité dans les données de l'INSEE 2020",
  formLancezRecherche:
    'Lancez la recherche ci-dessus pour pré-remplir les champs suivants',
  collectiviteExisteDeja: ({ id }: { id: number }): string =>
    `La collectivité cherchée existe déjà avec l'identifiant ${id}`,
  formCollectiviteTrouveeInsee:
    "Collectivité trouvée dans les données de l'INSEE. Veuillez compléter ou corriger les champs suivants si besoin avant de valider.",
  formCollectiviteNonTrouveeInsee:
    "Collectivité non trouvée dans les données de l'INSEE. Vous pouvez quand même saisir les données manuellement dans les champs suivants avant de valider.",
  formNomCollectivite: 'Nom de la collectivité',
  population: 'Population',
  formCreerCollectivite: 'Créer la collectivité',
  formChargement: 'Chargement...',
  formCreationReussie: ({ id }: { id: number }): string =>
    `Création réussie. Identifiant de la collectivité créée : ${id}`,
  formErreurCreation: ({ error }: { error: string }): string =>
    `Erreur lors de la création : ${error}`,
  formModificationReussie:
    'Modification réussie. Certaines modifications ne seront visibles sur la plateforme que le lendemain. Demandez à un développeur pour les voir avant.',
  formErreurModification: ({ error }: { error: string }): string =>
    `Erreur lors de la modification : ${error}`,
  formCodeCommune: 'Code commune',
  formCodeCommuneHint:
    'Le code attendu est le code commune INSEE et non le code postal',
  formCodeDepartement: 'Code département',
  formCodeDepartementHint:
    'Le code département est composé de 2 à 3 chiffres (01 à 999)',
  formCodeRegion: 'Code région',
  formCodeRegionHint: 'Le code région est composé de 2 chiffres (01 à 99)',
  typeCollectivite: 'Type de collectivité',
  formTypeEpci: 'EPCI',
  formTypePrefectureDepartement: 'Préfecture de département',
  formTypePrefectureRegion: 'Préfecture de région',
  formTypeServicePublic: 'Service public',
  formTypeCollectiviteTest: 'Collectivité test',
  formSiren: 'Siren',
  formSirenHint: 'Le siren est composé de 9 chiffres',
  formNic: 'NIC',
  formNicHint: 'Le NIC est composé de 5 chiffres',

  filtreEngageesRechercher: 'Rechercher par nom de collectivité',
  filtreEngageesTypePlan: 'Type de plan',
  filtreEngageesCollectivite: 'Collectivité',
  filtreEngageesNiveauLabellisation: 'Niveau de labellisation',

  confirmerSuppression: 'Confirmer la suppression',
  suppressionIndicateur: "Suppression de l'indicateur",
  suppressionIndicateurDescription:
    'Êtes-vous sûr de vouloir supprimer cet indicateur personnalisé ? Vous perdrez définitivement les données associées à cet indicateur.',
  modifierIndicateur: "Modifier l'indicateur",
  suppressionDonneesCollectivite: ({ annee }: { annee: number }): string =>
    `des données de la collectivité pour l'année ${annee}`,
  suppressionAnneeAttention: ({ annee }: { annee: number }): string =>
    `Attention, les données existantes pour l'année ${annee} seront supprimées.`,
  commentaireIndicateurTitre: ({
    sourceTypeLabel,
    unite,
    annee,
  }: {
    sourceTypeLabel: string;
    unite: string;
    annee: number;
  }): string => `Mes ${sourceTypeLabel} (${unite}) : ${annee}`,
  completerTableau: 'Compléter le tableau',
  inviterMembre: 'Inviter un membre',
  ajouterRapportVisite: 'Ajouter un rapport de visite annuelle',
  supprimerNoteConfirmation:
    "Cette note sera supprimée définitivement de l'action. Souhaitez-vous vraiment supprimer cette note ?",

  champNomAction: "Nom de l'action",
  niveauPriorite: 'Niveau de priorité',
  champDateFinPrevisionnelle: 'Date de fin prévisionnelle',
  thematique: 'Thématique',
  champNomIndicateur: "Nom de l'indicateur",
  champUnite: 'Unité',
  champDescriptionMethodologie: 'Description et méthodologie de calcul',
  commentaire: 'Commentaire',
  champAnnee: 'Année *',
  champResultat: 'Résultat',
  champObjectif: 'Objectif',
  champAjouterCommentaireResultat: 'Ajouter un commentaire sur le résultat',
  champAjouterCommentaireObjectif: "Ajouter un commentaire sur l'objectif",
  champAdresseEmailInvitation: 'Adresse email de la personne à inviter *',
  champNiveauAccesCollectivite: "Niveau d'accès pour cette collectivité  * ",
  champAssocierTagsPilotes:
    "Associer l'utilisateur à un ou plusieurs tag(s) pilote(s)",
  champAssocierTagsPilotesInfo:
    "Si vous avez ajouté une personne pilote à une action, une mesure ou un indicateur alors qu'elle n'avait pas encore de compte dans l'application, son nom apparaîtra dans cette liste. En l'associant à l'invitation, tous les éléments qui lui sont attribués seront automatiquement transférés vers son nouveau profil.",
  champDateVisiteAnnuelle: 'Date de la visite annuelle (obligatoire)',
  champDateVisite: 'Date de la visite',
  rechercherNomDescription: 'Rechercher par nom ou description',
  champActionsAjouterRapport: 'Actions à ajouter au rapport',
  champAjouterLogoCollectivite: 'Ajoutez le logo de votre collectivité',
  champDetailAfficheParAction: 'Détail affiché par action',
  optionDerniereNoteAction: "Dernière note de l'action",
  optionSaisieManuelleRapport: 'Saisie manuelle dans le rapport généré',
  apercuLogoAlt: 'Aperçu du logo',
  fichierSelectionne: 'Fichier sélectionné',
  champPersonnePiloteColon: 'Personne pilote :',
  champDirectionServicePiloteColon: 'Direction ou service pilote :',
  champThematiqueColon: 'Thématique :',
  tableauTitre: 'Titre',
  tableauPlan: 'Plan',
  tableauPilote: 'Pilote',
  tableauPriorite: 'Priorité',
  membres: 'Membres',
  membreNomEtAdresseMail: 'Nom et adresse mail',
  membreRole: 'Rôle',
  membreIntitulePoste: 'Intitulé de poste',
  membreChampIntervention: "Champ d'intervention",
  membreAcces: 'Accès',

  placeholderSelectionnezEluReferent:
    'Sélectionnez ou créez un·e élu·e référent·e',
  placeholderSelectionnezCibles: 'Sélectionner une ou plusieurs cibles',
  placeholderSelectionnezStatut: 'Sélectionner un statut',
  placeholderSelectionnezPeriode: 'Sélectionnez une période',
  placeholderRecherchezMotsCles: 'Recherchez par mots-clés',
  sansTitre: 'Sans titre',
  placeholderRechercher: 'Rechercher',
  placeholderARenseigner: 'À renseigner',
  placeholderSaisirTitre: 'Saisir un titre',
  placeholderRenseignezCollectivite: 'Renseignez le nom de la collectivité',
  placeholderAjouterMontant: 'Ajouter un montant',
  placeholderSelectionnezPlusieursPilotes:
    'Sélectionnez un ou plusieurs pilotes',
  placeholderSelectionnezPlusieursEluReferent:
    'Sélectionnez un ou plusieurs élu·e·s référent·e·s',
  supprimerIndicateur: "Supprimer l'indicateur",
  exporterXlsx: 'Exporter au format .xlsx',
  lierAction: 'Lier une action',
  ajouterNote: 'Ajouter une note',
  validerCompleter: 'Valider et compléter',
  enregistrementEnCours: 'Enregistrement en cours...',
  validerAjouterAnnee: 'Valider et ajouter une année',
  ajouterRapport: 'Ajouter le rapport',
  resultats: 'Résultats',
  objectifs: 'Objectifs',
  ajouterAnnee: 'Ajouter une année',
  ajouterSousAction: 'Ajouter une sous-action',
  creerPlan: 'Créer un plan',
  afficherGraphiques: 'Afficher les graphiques',
  toutesLesActions: 'Toutes les actions',

  editionPiloteTitre: 'Éditer la personne pilote',
  editionReferentTitre: "Éditer l'élu·e référent·e",
  editionServiceTitre: 'Éditer la direction ou service pilote',
  editionAjouterPilote: 'Ajouter une personne pilote',
  editionDissocierPilote: 'Dissocier une personne pilote',
  editionAjouterReferent: 'Ajouter un·e élu·e référent·e',
  editionDissocierReferent: 'Dissocier un·e élu·e référent·e',
  editionAjouterService: 'Ajouter une direction ou service pilote',
  editionDissocierService: 'Dissocier une direction ou service pilote',

  aucuneActionLiee: "Aucune action de vos plans n'est liée !",
  aucuneActionRecherche: 'Aucune action ne correspond à votre recherche',
  aucuneActionCreee: "Vous n'avez pas encore créé d'actions !",
  aucuneActionCreeeDescription:
    'Une fois vos actions créées, vous les retrouvez toutes dans cette vue où vous pourrez les filtrer sur de nombreux critères.',
  collectiviteSansPlan: "Cette collectivité n'a pas encore de plan",
  utilisateurSansPlan: "Vous n'avez pas encore créé de plan !",
  utilisateurSansPlanDescription:
    "Vous pouvez créer votre plan, qu'il soit déjà voté ou encore en cours d'élaboration.",
  utilisateurSansPlanDescriptionSuite:
    'Les actions seront modifiables à tout moment et vous pourrez les piloter depuis cette page !',
  aucuneSousAction: 'Aucune sous-action pour le moment',
  aucuneSousActionDescription:
    'Décomposez votre action en tâches concrètes pour faciliter son suivi et son pilotage.',
  aucunDocumentAssocie: "Aucun document n'est associé à cette action !",
  aucunIndicateurAssocie: 'Aucun indicateur associé !',
  aucunIndicateur: 'Aucun indicateur',
  neCorrespondPasRecherche: 'ne correspond à votre recherche',
  aucuneMesureLiee: "Aucune mesure des référentiels n'est liée !",
  aucuneNotesSuivi: 'Aucune note de suivi pour le moment',
  aucuneNotesSuiviDescription:
    "Ajoutez des notes pour documenter le suivi et l'avancement de votre fiche action.",
  actionsLiees: 'Actions liées',

  noteHeaderAnnee: 'Année',
  noteHeaderAuteurDate: 'Auteur/Date',
  documentsAssocies: 'Documents associés',
  documentsAssociesDescription:
    'Les documents affichés correspondent à ceux de cette collectivité.',
  documentsAssociesEmptyDescription:
    "Centraliser l'ensemble des informations associées à l'action en déposant les documents liés",
  indicateursAssocies: 'Indicateurs associés',
  indicateursAssociesDescription:
    'Les indicateurs et les données affichées correspondent à ceux de cette collectivité.',
  indicateursAssociesEmptyDescription:
    "Mesurez les résultats et l'impact de l'action grâce à des indicateurs",
  mesuresLiees: 'Mesures des référentiels liées',
  mesuresLieesDescription:
    'Les mesures des référentiels liées affichées correspondent à celles de cette collectivité.',
  actionsAssociees: 'Actions associées',
  actionsAssocieesDescription:
    'Les actions affichées correspondent à celles de cette collectivité.',
  actionsAssocieesEmptyTitle: "Cette action n'est liée à aucune autre action",
  actionsAssocieesEmptyDescription:
    'Ici vous pouvez faire référence à d’autres actions de vos plans',
  mesuresLieesEmptyDescription:
    'Ici vous pouvez lier votre action avec une mesure des référentiels Climat Air Energie et Economie Circulaire de l’ADEME',
  lierMesureReferentiels: 'Lier une mesure des référentiels',
  lierIndicateurExistant: 'Lier un indicateur existant',
  creerIndicateur: 'Créer un indicateur',
  dissocierIndicateur: "Dissocier l'indicateur",
  sousActionHeaderActionParente: 'Action parente',
  sousActionActionParenteIntrouvable: 'Action introuvable',

  checkboxSansDateFinPrevisionnelle: 'Sans date de fin prévisionnelle',
  checkboxAjouterIndicateurFavoris:
    "Ajouter l'indicateur à la sélection d'indicateurs favoris de ma collectivité",

  indicateurAlertDescription:
    'Les indicateurs personnalisés vous permettent de suivre de manière spécifique les actions menées par votre collectivité. Associez-les à une ou plusieurs actions pour faciliter leur mise à jour !',
  indicateurValidationTitreRequis: 'Un titre est requis',
  indicateurValidationTitreMax: 'Ce champ doit faire au maximum 300 caractères',

  confirmDeleteValeur: 'Valeur',
  confirmDeleteResultatUnite: ({ unite }: { unite: string }): string =>
    `Résultat (${unite})`,
  confirmDeleteObjectifUnite: ({ unite }: { unite: string }): string =>
    `Objectif (${unite})`,
  confirmDeleteAstuceEntree:
    'Astuce : appuyer sur Entrée pour valider et ajouter une autre année rapidement.',
  supprimerBudgetDescription:
    "Ce budget sera supprimé définitivement de l'action. Souhaitez-vous vraiment supprimer ce budget ?",
  supprimerFinanceurDescription:
    "Ce financeur sera supprimé définitivement de l'action. Souhaitez-vous vraiment supprimer ce financeur ?",
  confirmDeleteSousActionDescription:
    'Souhaitez-vous vraiment supprimer cette sous-action ?',
  exportTermine: 'Export terminé',
  exportEchec: "Échec de l'export",
  telechargementFichierReussi: 'Fichier téléchargé',
  telechargementFichierErreur: 'Erreur de téléchargement',
  telechargementEnCours: 'Téléchargement en cours...',
  annulerTelechargement: 'Annuler le téléchargement',
  telechargerEtatDesLieux: "Télécharger l'état des lieux",
  etatDesLieuxActuel: 'État des lieux actuel',
  selectionnerVersionsTelecharger:
    'Sélectionnez la ou les versions à télécharger :',
  formatTelechargement: 'Format :',
  telechargementDeuxVersionsMaximum:
    'Vous ne pouvez sélectionner que deux versions maximum.',
  telechargerVersionsAriaLabel: ({
    count,
    format,
  }: {
    count: number;
    format: string;
  }): string => `Télécharger ${count} version(s) au format ${format}`,
  veillezSelectionnerVersionAvantValidation:
    'Veuillez sélectionner au moins une version avant de valider',
  telechargementAuditHorsTetAlerte:
    "Il n'est pas possible de sélectionner les sauvegardes issues de labellisations dont l'audit n'a pas été réalisé sur Territoires en Transitions.",
  deuxVersionsMemeFichierComparaison:
    'Si vous sélectionnez deux versions, elles seront téléchargées dans un même fichier Excel pour comparaison.',
  telechargerTousDocuments: 'Télécharger tous les documents',
  importPlanFichierEnvoiErreur: "Erreur lors de l'envoi du fichier.",
  mutationSuccess: 'Modification enregistrée',
  mutationError: "Erreur lors de l'enregistrement",
  mutationErreurReseauSauvegarde:
    "La connexion réseau semble être interrompue. Vos données ne peuvent pas être sauvegardées pour l'instant. Veuillez attendre que votre connexion soit rétablie pour utiliser l'application.",
  aucuneOptionDisponible: 'Aucune option disponible',
  aucunResultat: 'Aucun résultat',
  tousLesPlans: 'Tous les plans',
  aucunMembreRattacheCollectivite:
    "Aucun membre n'est rattaché à la collectivité",
  aucunRapportVisiteAnnuelle:
    "Aucun rapport de visite annuelle n'a été ajouté.",
  erreurChargementPage: 'Erreur lors du chargement de la page !',
  rechargerPage: 'Recharger la page',
  banniere: 'Bannière',
  banniereType: 'Type',
  banniereContenu: 'Contenu',
  banniereContenuAriaLabel: 'Contenu de la bannière',
  banniereActive: 'Bannière active',
  banniereApercu: 'Aperçu',
  avertissement: 'Avertissement',
  erreur: 'Erreur',
  evenement: 'Événement',
  banniereErreurChargement:
    'Erreur de chargement de la bannière. Réessayez ou rechargez la page.',
  banniereDerniereModification: ({
    date,
    nom,
  }: {
    date: string;
    nom: string;
  }): string => `Dernière modification le ${date} par ${nom}`,
  erreurPartageMessageCrash: ({ crashId }: { crashId: string }): string =>
    `Dans l'optique de pouvoir régler ce problème technique et améliorer l'expérience pour tous nos utilisateurs, nous vous invitons à nous partager le message d'erreur ainsi que l'identifiant ${crashId} via le chat en bas à droite, ou par mail à contact@territoiresentransitions.fr`,
  trajectoireDonneesInsuffisantesCalcul:
    'Données disponibles insuffisantes pour le calcul',
  trajectoireDonneesInsuffisantesDescriptionMutateur:
    'Nous ne disposons pas encore des données suffisantes pour permettre le calcul automatique de la trajectoire SNBC territorialisée de votre collectivité. Vous pouvez néanmoins lancer un calcul en complétant les données disponibles en open data avec vos propres données. Vous pourrez ainsi visualiser facilement votre trajectoire SNBC territorialisée et la comparer aux objectifs fixés et résultats observés.',
  trajectoireDonneesInsuffisantesDescriptionLecture:
    'Nous ne disposons pas encore des données suffisantes pour permettre le calcul automatique de la trajectoire SNBC territorialisé de votre collectivité.',
  trajectoireDonneesInsuffisantesDescriptionLectureHighlight:
    'Un utilisateur en Edition ou Admin sur le profil de cette collectivité',
  trajectoireDonneesInsuffisantesDescriptionLectureSuite:
    'peut néanmoins lancer un calcul en complétant les données disponibles en open data avec celles disponibles au sein de la collectivité. Vous pourrez ensuite visualiser facilement votre trajectoire SNBC territorialisée et la comparer aux objectifs fixés et résultats observés.',
  trajectoireCompleterDonnees: 'Compléter mes données',
  trajectoireDroitsInsuffisants: 'Droits insuffisants',
  trajectoireDroitsInsuffisantsDescription:
    'La trajectoire des autres collectivités n’est pas encore accessible en mode visite. Elle le sera très prochainement.',
  trajectoireErreurChargementDonnees: 'Erreur lors du chargement des données',
  trajectoireErreurChargementDonneesDescription:
    'Veuillez ré-essayer dans quelques instants. Si le problème persiste merci de contacter le support.',
  trajectoireTitrePresentation:
    'Calculez votre trajectoire de transition bas-carbone avec la méthode développée par l’ADEME.',
  trajectoireSousTitrePresentation:
    'C’est un excellent outil stratégique pour :',
  trajectoireObjectif1:
    "Définir ou évaluer vos objectifs, par exemple lors d'un suivi annuel ou d'un bilan à mi-parcours de PCAET",
  trajectoireObjectif2:
    'Quantifier les efforts nécessaires secteur par secteur',
  trajectoireObjectif3: 'Identifier votre contribution à la SNBC',
  trajectoirePresentationDescription:
    "Cette trajectoire n'est pas prescriptive, mais peut constituer un repère pour guider votre stratégie, vos actions.",
  trajectoirePlusInformations: 'Pour plus d’informations',
  trajectoireAcceder: 'J’accède à la trajectoire',
  trajectoireCalculEnCoursInfo:
    'Le calcul de la trajectoire peut prendre jusqu’à 25 secondes. Il s’est lancé automatiquement à l’arrivée sur la page.',
  trajectoireMethodologieLimiteeCommunes:
    'Méthodologie limitée pour les communes',
  trajectoireMethodologieLimiteeCommunesDescription:
    "La méthodologie de territorialisation de la SNBC est conçue pour les niveaux allant de l'EPCI à la région. Bien que les principes et les calculs soient applicables à l'échelle communale, certaines données nécessaires ne sont pas disponibles pour ce niveau.",
  trajectoireMethodologieLimiteeCommunesSubtitle:
    "Nous mettons à votre disposition le fichier de calcul et de méthodologie pour vous informer sur les processus et les principes de cette méthode, dans le cas où vous souhaiteriez vous en inspirer. La méthodogie permettant de calculer la trajectoire SNBC territorialisée a été développée pour l'ADEME par Solagro et l'Institut Negawatt. Fruit d'un travail de 18 mois avec la contribution de 13 collectivités pilotes volontaires, elle a permis de construire une méthode de référence pour aider les territoires à définir et à interroger leur trajectoire bas-carbone.",
  trajectoireTelechargerModeleXlsx: 'Télécharger le modèle (.xlsx)',
  trajectoireTelechargerMethodologiePdf: 'Télécharger la méthodologie (.pdf)',
  trajectoireAllerPlusLoin: 'Aller plus loin',
  trajectoireAllerPlusLoinDescription:
    'Téléchargez le fichier Excel de calcul pour comprendre le détail des calculs et approfondir votre analyse.',
  trajectoireTelechargerDonneesXlsx: 'Télécharger les données (.xlsx)',
  trajectoireTelechargerFichiersMethodologie:
    'Télécharger les fichiers de l’étude détaillant la méthodologie, etc.',
  trajectoireSimulateurTerritorial: 'Simulateur territorial',
  trajectoireVoirSimulateurSgpe: 'Voir le simulateur du SGPE',
  trajectoireEnSavoirPlus: 'En savoir plus',
  trajectoireRecalculer: 'Recalculer la trajectoire',
  trajectoireTousLesSecteurs: 'Tous les secteurs',
  trajectoireDonneesPartiellesDescriptionLecture:
    "Il manque des données pour certains secteurs : un utilisateur en Edition ou Admin sur le profil de cette collectivité peut compléter les données manquantes pour l'année 2015 afin de finaliser le calcul",
  trajectoireVoirFicheIndicateur: "Voir la fiche de l'indicateur",
  trajectoireVoirFichesIndicateurs: 'Voir les fiches des indicateurs :',
  trajectoireDonneesPartiellesTitle:
    'Voici un premier calcul de votre trajectoire SNBC territorialisée, avec les données disponibles !',
  trajectoireDonneesPartiellesDescription:
    "Il manque des données pour certains secteurs : complétez les données manquantes pour l'année 2015 afin de finaliser le calcul.",
  trajectoireCompleterDonneesLabel: 'Compléter les données',
  trajectoireMethodologie: 'Méthodologie',
  trajectoireMethodologieTerritorialisation: 'Méthode de territorialisation',
  donneesNonDisponibles: 'Données non disponibles',
  financeurs: 'Financeurs',

  indicateurRetirerFavoris: 'Retirer des favoris de ma collectivité',
  indicateurAjouterFavoris: 'Ajouter aux favoris de ma collectivité',
  retirerFavoris: 'Retirer des favoris',
  ajouterFavoris: 'Ajouter aux favoris',
  telechargerGraphiquePng: 'Télécharger le graphique (.png)',
  telechargerGraphique: 'Télécharger le graphique',
  aucuneValeurCollectivite:
    "Aucune valeur n'est associée aux résultats ou aux objectifs de la collectivité !",
  aucuneValeurTrouvee: 'Aucune valeur trouvée',
  ajouterValeur: 'Ajouter une valeur',
  supprimerFiltres: 'Supprimer tous les filtres',
  exporterIndicateursFiltresExcel:
    'Exporter le résultat de mon filtre en Excel',
  exporterTousIndicateursExcel: 'Exporter tous les indicateurs en Excel',

  actionsNonClassees: 'Actions non classées',

  metadataCreee: 'Créée',
  metadataModifiee: 'Modifiée',

  actionIssueActionsAImpact: 'Action issue du service "Actions à Impact"',
  retirerPartage: 'Retirer le partage',
  retirerPartageDescription: ({
    collectiviteNom,
  }: {
    collectiviteNom: string;
  }): string =>
    `Cette action vous a été partagée par la collectivité "${collectiviteNom}". Sa suppression de votre collectivité n’affectera pas son existence dans la collectivité qui vous l’a partagée, où elle restera accessible.`,

  referentAssocierReferents: 'Associer des référents',
  referentStatutDescription:
    "\"Référent\" est un statut lié au programme Territoire Engagé Transition Écologique de l'ADEME. Les personnes désignées ci-après sont les contacts privilégiés de la collectivité pour l'ADEME et toutes les personnes intervenants dans ce cadre (Bureau d'Appui, auditeur, membre de la CNL) ainsi que pour leurs homologues dans d'autres collectivités.",
  referentPersonneNonIdentifiee: ({ fonction }: { fonction: string }): string =>
    `Personne n'est identifié comme "${fonction}" dans la `,
  referentInscritIntraAdemeAvant: "Inscrit sur l'espace collaboratif",
  referentInscritIntraAdemeLien: 'IntrADEME',
  referentInscritIntraAdemeApres: ({ email }: { email: string }): string =>
    `des collectivités ? Envoyer un mail à ${email} ou via le chat.`,
  referentGestionDesMembres: 'gestion des membres',

  indicateurVideFavoris:
    "Votre collectivité n'a pas encore d'indicateurs favoris",
  indicateurVideFavorisDescription:
    'Ajoutez en à cet espace en utilisant l\'icône "étoile" sur les pages indicateurs.',
  indicateurVidePersonnalise:
    "Votre collectivité n'a pas encore d'indicateurs personnalisés",
  indicateurVideMesIndicateurs:
    "Vous n'avez aucun indicateur associé à votre nom",
  indicateurVideMesIndicateursDescription:
    'Parcourez les indicateurs pour vous assigner en tant que pilote.\nCela vous facilitera le suivi et la mise à jour !',
  indicateurVideParcourir: 'Parcourir les indicateurs',
  indicateurVideCreerPersonnalise: 'Créer un indicateur personnalisé',
  indicateurVideAucunResultat:
    'Aucun indicateur ne correspond à votre recherche',
  indicateurVideModifierFiltre: 'Modifier le filtre',

  preuveAnnexeConfidentielle:
    "Nous vous encourageons à partager vos documents : ils permettent à d'autres collectivités de s'inspirer de vos actions, de vos pratiques.\n\nSi vos documents sont confidentiels, vous pouvez activer cette option : seuls les membres de votre collectivité (dont votre conseiller et votre auditeur si vous êtes engagés dans le programme \"Territoire Engagé Transition Écologique\") et le service support de la plateforme pourront y accéder.\n\nSi l'action est en mode privé, les documents ne seront pas accessibles par des personnes n'étant pas membres de votre collectivité, que le document soit en mode privé ou non.",
  preuveDocConfidentiel:
    "Nous vous encourageons à partager vos documents : ils permettent à d'autres collectivités de s'inspirer de vos actions, vos pratiques, etc.\n\nSi vos documents sont confidentiels, vous pouvez activer cette option : seuls les membres de votre collectivité, votre conseiller, votre auditeur et le service support de la plateforme pourront y accéder",

  planOptionActionsAImpact: 'grâce aux "Actions à Impact"',

  ficheDescription: plural({ one: 'Description', other: 'Description' }),
  ficheObjectifs: plural({ one: 'Objectif(s)', other: 'Objectif(s)' }),
  ficheEffetsAttendus: plural({
    one: 'Effet attendu',
    other: 'Effets attendus',
  }),
  ficheThematiques: plural({ one: 'Thématique', other: 'Thématiques' }),
  ficheSousThematiques: plural({
    one: 'Sous-thématique',
    other: 'Sous-thématiques',
  }),
  ficheLibreTags: plural({
    one: 'Tag personnalisé',
    other: 'Tags personnalisés',
  }),

  actionLiee: countedPlural({ one: 'action liée', other: 'actions liées' }),
  document: countedPlural({ one: 'document', other: 'documents' }),
  indicateur: countedPlural({ one: 'indicateur', other: 'indicateurs' }),
  commentaires: countedPlural({ one: 'commentaire', other: 'commentaires' }),
  sousMesure: countedPlural({ one: 'sous-mesure', other: 'sous-mesures' }),
  sousAction: countedPlural({ one: 'sous-action', other: 'sous-actions' }),
  tache: countedPlural({ one: 'tâche', other: 'tâches' }),
  filtreActif: countedPlural({ one: 'filtre actif', other: 'filtres actifs' }),

  panneauHistorique: 'Historique',
  panneauInformations: 'Informations',

  statistiquesDetailTaches: ({
    filtresActifs,
    sousActions,
    sousActionsTotal,
    taches,
    tachesTotal,
  }: {
    filtresActifs: string;
    sousActions: string;
    sousActionsTotal: number;
    taches: string;
    tachesTotal: number;
  }): string =>
    `${filtresActifs} ; ${sousActions} sur ${sousActionsTotal} ; ${taches} sur ${tachesTotal}`,
} as const;
