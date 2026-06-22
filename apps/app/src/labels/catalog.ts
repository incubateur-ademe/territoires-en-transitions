import { ReferentielId } from '@tet/domain/referentiels';
import { countedPlural, plural } from '@tet/ui/labels/plural';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.territoiresentransitions.fr';

export const appLabels = {
  referentielCae: 'Climat Air Énergie',
  referentielEci: 'Économie Circulaire',
  referentielCrte: 'Contrat Relance Transition Écologique',
  referentielTe: 'Transition Écologique',
  referentielTeTest: 'Transition Écologique (test)',

  nonRenseigne: 'Non renseigné',
  nonRenseignable: 'Non renseignable',
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
  eluReferent: plural({ one: 'Élu·e référent·e', other: 'Élu·es référent·es' }),
  equipeProjet: plural({ one: 'Équipe projet', other: 'Équipe projet' }),
  referentTechnique: plural({
    one: 'Référent·e technique',
    other: 'Référent·es techniques',
  }),
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
  figerEtatDesLieux: "Figer l'état des lieux",
  editerReferentiel: 'Éditer le référentiel',
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
  obtenirPremiereEtoile: 'Obtenir la première étoile',
  demanderAudit: 'Demander un audit',
  demarrerAuditChoixType: "Quel type d'audit souhaitez-vous demander ?",
  demarrerAuditChoixEtoile: 'Quelle étoile visez-vous ?',
  demarrerAuditEtoileOption: ({
    etoileLabel,
  }: {
    etoileLabel: string;
  }): string => `${etoileLabel} étoile`,
  demarrerAuditCotAvecLabellisationMessage:
    'Pour passer en CNL, penser à joindre les documents de labellisation.',
  demarrerAuditEnvoyer: 'Envoyer ma demande',
  demarrerAuditDemandeSucces: "Votre demande d'audit a bien été envoyée.",
  demarrerAuditSelectionIncomplete:
    "Sélectionnez un type d'audit et une étoile.",
  demarrerAuditTypeCotAvecLabellisation: 'Audit COT avec labellisation',
  demarrerAuditTypeLabellisation: 'Audit de labellisation',
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
  navDemarchePcaet: 'Démarches PCAET',
  demarchePcaetAccesTitre: 'Déposez votre PCAET réglementaire',
  demarchePcaetAccesDescription:
    'Suivez et déposez votre Plan Climat Air Énergie Territorial directement depuis la plateforme.',
  demarchePcaetAcceder: 'Accéder à la démarche PCAET',
  demarchePcaetCreerTitre: 'Commencer le dépôt règlementaire du PCAET',
  demarchePcaetCreerCadreReglementaire:
    "Les collectivités devant mettre en œuvre un PCAET au titre de l'article L229-26 du code de l'environnement ont la possibilité de déposer leur projet de PCAET, et l'obligation de déposer leur plan climat-air-énergie territoriaux adopté dans cet espace.",
  demarchePcaetCreerDescription:
    "Déposer votre PCAET : diagnostic et objectifs, programme d'actions et documents joints",
  demarchePcaetCreerIntitule: 'Intitulé de la démarche',
  demarchePcaetCreerObligation: 'Obligation',
  demarchePcaetCreerObligationReglementaire: 'Obligation réglementaire',
  demarchePcaetCreerObligationVolontaire: 'Volontaire',
  demarchePcaetCreerPilotes: 'Pilotes',
  demarchePcaetCreerRechercherPilote: 'Rechercher un pilote…',
  demarchePcaetCreerDescriptionRapide: 'Description rapide (optionnel)',
  demarchePcaetCreerSoumettre: 'Commencer le dépôt',
  demarchePcaetCreerIntituleRequis: "L'intitulé de la démarche est requis",
  demarchePcaetCreerPilotesRequis: 'Au moins un pilote est requis',
  demarchePcaetDetailDescriptionTitre: 'Description rapide',
  demarchePcaetDetailDescriptionPlaceholder:
    'Présentation du PCAET, contexte territorial…',
  demarchePcaetDetailDescriptionVide: 'Aucune description renseignée.',
  demarchePcaetDetailDocumentsTitre: 'Ajouter les documents attendus',
  demarchePcaetDetailDocumentsDescription:
    "Déposer les pièces réglementaires obligatoires et d'autres documents optionnels.",
  demarchePcaetDetailVersionProvisoireTitre: 'Version provisoire',
  demarchePcaetDetailVersionProvisoireDescription:
    "Les données de la démarche sont stockées localement le temps de brancher l'API PCAET. Le statut brouillon / publiée et les pilotes sont enregistrés dans votre navigateur.",
  demarchePcaetDetailPublieeTitre: 'Démarche publiée',
  demarchePcaetDetailPublieeDescription:
    'La démarche est en lecture seule. Repassez en brouillon pour modifier le contenu ou les pilotes.',
  demarchePcaetContactsTitre: 'Contacts',
  demarchePcaetContactsDescription:
    'Interlocuteurs désignés pour le suivi de votre démarche.',
  demarchePcaetContactAdeme: 'Contacts ADEME',
  demarchePcaetContactDreal: 'Contacts DREAL',
  demarchePcaetContactCr: 'Contacts Conseil régional',
  demarchePcaetAvanceTitre: 'Les étapes de votre démarche',
  demarchePcaetAvanceEtapeElaborationLabel: 'Élaboration',
  demarchePcaetAvanceEtapeElaborationDescription:
    "Rédaction du diagnostic, des objectifs et du programme d'actions par la collectivité.",
  demarchePcaetAvanceEtapeTransmisLabel: 'Transmis pour avis',
  demarchePcaetAvanceEtapeTransmisDescription:
    'Consultations auprès du conseil régional, du préfet de région et de la MRAe.',
  demarchePcaetAvanceEtapeTransmisInfo:
    'Ces services déconcentrés vont rendre leurs avis directement sur cette plateforme ou hors plateforme (par exemple par email…), dans un délai de 3 mois',
  demarchePcaetAvanceEtapeAdopteLabel: 'Adopté et en cours de mise en œuvre',
  demarchePcaetAvanceEtapeAdopteDescription:
    'PCAET en vigueur, pilotage des actions et indicateurs sur 6 ans.',
  demarchePcaetAvanceEtapeEvalMiParcoursLabel: 'Évaluation à mi-parcours',
  demarchePcaetAvanceEtapeEvalMiParcoursDescription:
    'Bilan obligatoire à mi-cycle (3 ans). Analyse des résultats et ajustement des actions.',
  demarchePcaetAvanceEtapeEvalFinaleLabel: 'Évaluation finale',
  demarchePcaetAvanceEtapeEvalFinaleDescription:
    "Bilan complet du cycle de 6 ans. Dépôt de l'évaluation auprès de l'ADEME pour clore la démarche.",
  demarchePcaetAvanceEtapeArchiveLabel: 'Archivé',
  demarchePcaetAvanceEtapeArchiveDescription: 'Évaluation finale déposée, cycle clos.',
  demarchePcaetAvanceTransmisEcheance: 'Échéance remise des avis :',
  demarchePcaetAvanceTransmisDepasse: 'Délai dépassé',
  demarchePcaetAvanceNouvelleDemarche: 'Nouvelle démarche',
  demarchePcaetAvanceRepasserBrouillon: 'Repasser en brouillon',
  demarchePcaetAvanceValiderTooltip:
    'Complétez la description, le diagnostic, le plan d’actions et les documents pour valider le dépôt.',
  demarchePcaetAvanceValiderDepot: 'Valider le dépôt pour avis',
  demarchePcaetVulnerabiliteDiagMaintenant: 'Diagnostic maintenant*',
  demarchePcaetVulnerabiliteDiag2050: 'Diag 2050',
  demarchePcaetVulnerabiliteDiag2100: 'Diag 2100',
  demarchePcaetVulnerabiliteObjectifs: 'Saisir vos objectifs',
  demarchePcaetDiagnosticTitre: 'Compléter le diagnostic et les objectifs',
  demarchePcaetDiagnosticDescription:
    'Consultez et complétez les indicateurs par volet du PCAET : tableau des valeurs, données par secteur et graphique.',
  demarchePcaetDiagnosticVoletComplete: 'Complété',
  demarchePcaetDiagnosticVoletAComplete: 'À compléter',
  demarchePcaetHistoriqueTitre: 'Historique des dépôts',
  demarchePcaetHistoriqueVoirDemarche: ({ titre }: { titre: string }): string =>
    `Voir la démarche ${titre}`,
  demarchePcaetDocumentsCouvertParPlan:
    'Couvert par le plan d’actions (sans document séparé)',
  demarchePcaetDocumentsRemplacerFichier: 'Remplacer le fichier',
  demarchePcaetDocumentsTeleverser: 'Téléverser',
  demarchePcaetDocumentsCouvertViaPlan: 'Couvert via le plan d’actions',
  demarchePcaetDocumentsCaption: 'Dépôt des pièces du dossier PCAET',
  demarchePcaetDocumentsColonneSection: 'Section',
  demarchePcaetDocumentsColonneDocuments: 'Documents liés',
  demarchePcaetProgrammeTitre: "Renseigner le programme d'actions",
  demarchePcaetProgrammeDescription:
    "Résumé des dernières actions du plan PCAET — ouvrez le plan pour piloter l'ensemble du programme.",
  demarchePcaetProgrammeChargement: 'Chargement du plan et des actions…',
  demarchePcaetProgrammeChargementPlan: 'Chargement du plan…',
  demarchePcaetProgrammeNoPlanIntro: ({
    typeLabel,
  }: {
    typeLabel: string;
  }): string =>
    `Aucun plan de type « ${typeLabel} » trouvé pour cette collectivité.`,
  demarchePcaetProgrammeNoPlanDetail:
    "Déposez votre fichier (PDF, word, excel) pour créer automatiquement toutes vos actions, ou déposez manuellement votre programme d'actions !",
  demarchePcaetProgrammeCreerPlan: "Renseigner le programme d'actions",
  demarchePcaetProgrammeSansTitre: 'Sans titre',
  demarchePcaetProgrammeVoirActions: 'Voir toutes les actions du plan',
  demarchePcaetProgrammeDetacherPlan: 'Détacher le plan',
  demarchePcaetProgrammeRattacherTitre: 'Rattacher un plan PCAET existant',
  demarchePcaetProgrammeRattacherDescription:
    'La collectivité peut déjà piloter son PCAET dans TET. Sélectionnez le plan à relier à cette démarche.',
  demarchePcaetProgrammePlanParDefaut: ({ id }: { id: number }): string =>
    `Plan #${id}`,
  demarchePcaetProgrammeSelectPlaceholder: 'Sélectionner un plan PCAET',
  demarchePcaetProgrammeLierPlan: 'Lier ce plan à la démarche',
  demarchePcaetProgrammeCreerNouveauPlan: 'Créer un nouveau plan PCAET',
  demarchePcaetVoletIndicateurOuvrirFiche: 'Ouvrir la fiche indicateur',
  demarchePcaetVoletIndicateurIntrouvableTitre: 'Indicateur introuvable',
  demarchePcaetVoletIndicateurIntrouvableDescription: ({
    voletLabel,
    identifiant,
  }: {
    voletLabel: string;
    identifiant: string;
  }): string =>
    `L’indicateur associé au volet « ${voletLabel} » (${identifiant}) n’est pas disponible pour cette collectivité.`,
  demarchePcaetVoletIndicateurReadonlyTitre: 'Démarche publiée',
  demarchePcaetVoletIndicateurReadonlyDescription:
    'Les données indicateurs restent consultables. Repassez la démarche en brouillon pour signaler une modification du dossier PCAET.',
  demarchePcaetStatutControlLabel: 'Statut',
  demarchePcaetStatutPublieeLe: ({ date }: { date: string }): string =>
    `Publiée le ${date}`,
  demarchePcaetVoletModalDocumentsDescription:
    'Déposez les pièces liées à la vulnérabilité du territoire. La bibliothèque complète reste accessible depuis les paramètres de la collectivité.',
  demarchePcaetVoletModalReadonly:
    'La démarche est publiée : les documents ne sont plus modifiables depuis cette vue.',
  demarchePcaetVoletModalOuvrirBibliotheque: 'Ouvrir la bibliothèque',
  demarchePcaetVoletModalAucunIndicateur:
    'Aucun indicateur n’est configuré pour ce volet.',
  demarchePcaetVoletModalAccederPage: 'Accéder à la page dédiée',
  demarchePcaetHeaderDateLancement: 'Date de lancement',
  demarchePcaetHeaderDepotCommenceLe: 'Dépôt commencé le',
  demarchePcaetHeaderModifieLe: 'Modifié le',
  demarchePcaetObligationObligatoire: 'Obligatoire',
  demarchePcaetObligationVolontaire: 'Volontaire',
  demarchePcaetBadgePubliee: 'Publiée',
  demarchePcaetHeaderPiloteSingulier: 'Pilote',
  demarchePcaetHeaderPilotePluriel: 'Pilotes',
  demarchePcaetPolluantsTitre: 'Saisie des polluants atmosphériques',
  demarchePcaetPolluantsDescription:
    "Chaque ligne croise un secteur et un polluant. Cliquez dans une cellule puis collez vos données depuis un tableur (Ctrl+V), ou saisissez-les directement. Pour les objectifs, vous pouvez coller des valeurs relatives en % (ex. -40%), converties par rapport à l'année de référence. Validez pour enregistrer.",
  demarchePcaetPolluantsAnneeReference: 'Année de référence',
  demarchePcaetPolluantsVueAPlat: 'Vue à plat',
  demarchePcaetPolluantsParSecteur: 'Par secteur',
  demarchePcaetPolluantsAfficherOpenData: ({
    count,
  }: {
    count: number;
  }): string => `Afficher l'open data pour les ${count} cellule(s) vide(s)`,
  demarchePcaetPolluantsCellulesIgnorees: 'Cellules ignorées lors du collage',
  demarchePcaetPolluantsMasquerErreurs: 'Masquer',
  demarchePcaetPolluantsValeursEnAttente: ({
    count,
  }: {
    count: number;
  }): string => `${count} valeur(s) en attente`,
  demarchePcaetPolluantsAnnulerModifications: 'Annuler les modifications',
  demarchePcaetPolluantsColonneSecteur: 'Secteur',
  demarchePcaetPolluantsColonnePolluant: 'Polluant',
  demarchePcaetPolluantsCelluleAriaLabel: ({
    polluant,
    secteur,
    annee,
  }: {
    polluant: string;
    secteur: string;
    annee: number;
  }): string => `${polluant} ${secteur} ${annee}`,
  demarchePcaetPolluantsUtiliserOpenData: 'Utiliser la valeur open data',
  demarchePcaetPolluantsErreurHorsGrille: 'hors de la grille',
  demarchePcaetPolluantsErreurNonNumerique: 'valeur non numérique',
  demarchePcaetPolluantsErreurCellule: ({
    ligne,
    colonne,
    valeur,
    raison,
  }: {
    ligne: number;
    colonne: number;
    valeur: string;
    raison: string;
  }): string => `Ligne ${ligne}, colonne ${colonne} : "${valeur}" (${raison})`,
  demarchePcaetPolluantsErreurRelativeSansReference: ({
    indicateur,
    annee,
  }: {
    indicateur: string | number;
    annee: number;
  }): string =>
    `${indicateur} ${annee} : valeur relative sans valeur de référence`,
  demarchePcaetPolluantsValeursEnregistrees: 'Valeurs enregistrées',
  demarchePcaetPolluantsValeursEnregistreesDemo:
    'Valeurs enregistrées (démo locale)',
  demarchePcaetPolluantsSecteurResidentiel: 'Résidentiel',
  demarchePcaetPolluantsSecteurTertiaire: 'Tertiaire',
  demarchePcaetPolluantsSecteurTransportRoutier: 'Transport routier',
  demarchePcaetPolluantsSecteurAutresTransports: 'Autres transports',
  demarchePcaetPolluantsSecteurAgriculture: 'Agriculture',
  demarchePcaetPolluantsSecteurIndustrieHorsEnergie: 'Industrie hors énergie',
  demarchePcaetPolluantsSecteurIndustrieEnergie: "Industrie de l'énergie",
  demarchePcaetPolluantsSecteurDechets: 'Déchets',

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
  formTypeStructureSansStatutJuridique: 'Structure sans statut juridique',
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
  optionDerniereNoteAction: "Inclure la dernière note de l'action",
  optionSaisieManuelleRapport: 'Inclure une section vide pour saisie libre',
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
  filtrer: 'Filtrer',
  filtrerAvecCount: ({ count }: { count: number }): string =>
    `Filtrer (${count})`,
  afficherLesResultats: 'Afficher les résultats',
  collectivitesTitre: 'Collectivités',
  referentielsTitre: 'Référentiels',
  plansTitre: 'Plans',
  correspondAVotreRecherche: ({
    count,
    label,
  }: {
    count: number | string;
    label: string;
  }): string =>
    `${count} ${label} ${
      count === 1 ? 'correspond' : 'correspondent'
    } à votre recherche`,
  importEnCoursDelai: 'Import en cours, cela peut prendre quelques secondes.',
  questionLabel: 'Question :',
  reponseLorsDeJustificationLabel: 'Réponse (lors de la justification) :',
  justificationLorsDeReponseLabel: 'Justification (lors de la réponse) :',
  badgeOpenDataExplanation:
    'Nous mettons à votre disposition automatiquement des données issues de sources vérifiées (CEREMA, RARE, SINOE…).',
  enSavoirPlus: 'en savoir plus',
  indicateurModifieLeLabel: 'Modifié le',
  indicateurParticipeAuScore: 'Participe au score',
  parPrenomNom: ({ prenom, nom }: { prenom?: string; nom?: string }): string =>
    `par ${prenom ?? ''} ${nom ?? ''}`,
  recalculerLaTrajectoire: 'Recalculer la trajectoire',
  donneesObserveesAnneeReferenceSNBC:
    "Vous pouvez lancer un calcul de la trajectoire SNBC territorialisée en complétant les données ci-après. Les données à entrer sont les résultats observés pour l'année 2015 : c'est l'année de référence de la SNBC v2.",
  calculEnCours: 'Calcul en cours',
  voirLeResultat: 'Voir le résultat',
  informationsAdministrativesOfficielles:
    'Informations administratives officielles',
  nonModifiable: 'Non modifiable',
  personnalisationHeaderTexte:
    'Les mesures et sous mesures proposées dans les référentiels dépendent des compétences et caractéristiques de chaque collectivité.',
  deBanatic: 'de Banatic.',
  nbSuggestionReponseProvient: ({ count }: { count: number }): string =>
    count > 1
      ? 'suggestions de réponse proviennent'
      : 'suggestion de réponse provient',
  reponseDifferenteBanatic:
    "Votre réponse n'est pas identique aux données provenant de Banatic, merci de détailler votre réponse",
  transfertVers: 'Transfert vers',
  defaultJustificationPlaceholder:
    "Préciser votre réponse : date de délibération, périmètre d'application, quelle autre collectivité exerce la compétence en cas de transfert, etc.",
  ouvrir: 'Ouvrir',
  actionPartageeEnEditionAvec: 'Cette action est partagée en édition avec',
  actionVousEstPartageeEnEditionPar:
    'Cette action vous est partagée en édition par la collectivité',
  labelDeuxPoints: ({ label }: { label: string }): string => `${label} :`,
  dateDebutFinPrevisionnelleLabel: 'Date de début et de fin prévisionnelle :',
  tempsDeMiseEnOeuvre: 'Temps de mise en œuvre',
  actionSeRepeteTousLesAns:
    "L'action se répète tous les ans, sans date de fin prévisionnelle",
  actionNeSeRepetePasTousLesAns: "L'action ne se répète pas tous les ans",
  selectionnerUnFinanceur: 'Sélectionner un financeur',
  aucunPlanRattacherAction:
    "Il n'existe aucun plan auquel rattacher cette action",
  validerCeNouvelEmplacement: 'Valider ce nouvel emplacement',
  contenuActionSyncQuelQueSoitEmplacement:
    "Le contenu de l'action sera mis à jour de manière synchronisée quel que soit l'emplacement",
  aucuneActionDansCePlan: 'Aucune action dans ce plan',
  completezStatutsActionsPourRepartition:
    'Complétez les statuts de vos actions pour voir la répartition',
  creerUnPlan: 'Créer un plan',
  vousSouhaitez: 'Vous souhaitez',
  resultatPluralWord: ({ count }: { count: number }): string =>
    count > 1 ? 'résultats' : 'résultat',
  aucuneActionCorrespondRecherche:
    'Aucune action ne correspond à votre recherche',
  creerUneAction: 'Créer une action',
  actionsMasqueesDansAffichageGlobal:
    "Les actions sont masquées dans l'affichage global",
  cliquerPourOuvrirFermerLAxe:
    "Cliquer pour ouvrir/fermer l'axe. Shift+clic pour éditer le titre.",
  aucunCommentairePourInstant: ({
    state,
  }: {
    state: 'all' | 'ouvert' | 'ferme';
  }): string =>
    `Aucun commentaire ${
      state === 'all' ? '' : state === 'ouvert' ? 'ouvert' : 'fermé'
    } pour l'instant`,
  actionTitreAvecIdentifiant: ({
    identifiant,
    nom,
  }: {
    identifiant: string;
    nom: string;
  }): string => `${identifiant} - ${nom}`,
  renseignerStatutsReferentiel: 'Renseigner tous les statuts du référentiel',
  mettreAJour: 'Mettre à jour',
  atteindreScoreRealiseStatutFait: ({
    scorePercent,
  }: {
    scorePercent: string;
  }): string =>
    `Atteindre un score réalisé (statut Fait) d'au moins ${scorePercent} % et le prouver (via les documents preuves ou un texte justificatif)`,
  texteAuditFinanceParAdeme:
    "Cet audit a un coût qui est aujourd'hui financé par l'ADEME.",
  premierNiveauLabellisationSansAudit:
    "Le premier niveau de labellisation ne nécessite pas d'audit et sera validé rapidement et directement par l'ADEME ! Les étoiles supérieures sont conditionnées à un audit réalisé par une personne experte mandatée par l'ADEME.",
  bravoSeuilAtteintEtoileSuivante: ({
    scorePercent,
    numLabel,
  }: {
    scorePercent: string;
    numLabel: string;
  }): string =>
    `Bravo, vous avez plus de ${scorePercent} % d'actions réalisées ! Les critères ont été mis à jour pour préparer votre candidature à la ${numLabel} étoile.`,
  actionsGroupees: 'Actions groupées',
  rechercherParNomOuDescription: 'Rechercher par nom ou description',
  vueGrille: 'Grille',
  vueTableau: 'Tableau',
  vueCalendrier: 'Calendrier',
  selectionnerToutesLesActions: 'Sélectionner toutes les actions',
  actionSelectionneeCountLabel: ({ count }: { count: number }): string =>
    `${count} action${count > 1 ? 's' : ''} sélectionnée${
      count > 1 ? 's' : ''
    }`,
  actionCountTotal: ({ count }: { count: number }): string =>
    `/ ${count} action${count > 1 ? 's' : ''}`,
  criteresDeLabellisation: 'Critères de labellisation',
  envoyerMaDemandeLabel: 'Envoyer ma demande',
  revenirPreparationAudit: "Revenir à la préparation de l'audit",
  demanderUnAudit: 'Demander un audit',
  demanderLaPremiereEtoile: 'Demander la première étoile',
  demanderAuditPourEtoile: ({ numLabel }: { numLabel: string }): string =>
    `Demander un audit pour la ${numLabel} étoile`,
  envoiEnCoursLabel: 'Envoi en cours...',
  bravoConditionsPremiereEtoile:
    "Bravo ! Vous remplissez apparemment les conditions minimales requises pour la première étoile. Ces conditions vont être vérifiées par l'ADEME qui reviendra vers vous par mail dans les prochaines 48h (ouvrées) pour vous confirmer l'attribution de la première étoile ou vous demander des informations complémentaires !",
  bravoConditionsAuditAvecParenthese: ({
    parenthese,
  }: {
    parenthese: string;
  }): string =>
    `Bravo ! Vous remplissez apparemment les conditions minimales requises pour la demande d'audit. Après vérification du bon respect des critères, le Bureau d'Appui reviendra vers vous rapidement pour vous informer des suites de la procédure (${parenthese}).`,
  recommandeMargeMinimaleEtoile:
    "Il est recommandé de disposer d'une marge minimale de 3 % par rapport au seuil minimum de l'étoile pour tenir compte des risques d'évolution à la baisse de la notation globale lors de l'audit.",
  parentheseCalendrierDesignationAuditeur:
    "calendrier de labellisation et désignation d'un auditeur",
  parentheseCalendrierDossierDesignationAuditeur:
    "calendrier de labellisation, constitution d'un dossier de demande de labellisation et désignation d'un auditeur",
  parentheseCalendrierEuropeenAuditeurs:
    "calendrier européen de labellisation et désignation d'un auditeur national et de l'auditeur international eea Gold",
  demandeLabellisationEnvoyee:
    "Votre demande de labellisation a bien été envoyée. Vous recevrez dans les 48h ouvrées un mail de l'ADEME.",
  demandeAuditEnvoyee: "Votre demande d'audit a bien été envoyée.",
  commencerLAudit: "Commencer l'audit",
  etoileDepuisLe: 'étoile depuis le',
  potentielLabel: 'Potentiel',
  scorePotentielPointCount: ({ count }: { count: string }): string =>
    `${count} point${parseFloat(count) > 1 ? 's' : ''}`,
  scoreFraction: ({ score, max }: { score: string; max: string }): string =>
    `${score} / ${max}`,
  champInterventionLabel: "Champ d'intervention :",
  intituleDePosteLabel: 'Intitulé de poste :',
  valeurAbsoluePoints: 'Valeur absolue (points)',
  valeurRelativePourcent: 'Valeur relative (%)',
  telechargerLeGraphique: 'Télécharger le graphique',
  detailsLabel: 'Détails',
  etape: ({ index }: { index: number }): string => `Étape ${index}`,
  enCliquantIci: 'en cliquant ici.',
  ressources: 'Ressources',
  revenirEtapePrecedente: "Revenir à l'étape précédente",
  importerUnPlan: 'Importer un plan',
  importPlanTelechargerModele: 'Télécharger le modèle',
  importPlanTelechargerModeleEtapeTitre: 'Téléchargez le modèle de plan',
  importPlanModeleStructureFormat:
    'Il est structuré selon le format attendu par la plateforme.',
  importPlanCompleterFichierEtapeTitre:
    'Complétez le fichier avec les informations de votre plan',
  importPlanModeleDescription:
    'Le modèle vous permet de renseigner la structure du plan ainsi que les principales données utiles au pilotage. Le reste sera a compléter sur la plateforme.',
  importPlanConsignesRespect:
    "Veillez à bien respecter les consignes de remplissage présentes dans le fichier, pour garantir la bonne prise en compte des données lors de l'import sur la plateforme.",
  importPlanEnvoyerEmailEtapeTitre:
    'Envoyez-nous le fichier complété par email',
  importPlanAdresseLabel: 'Adresse :',
  importPlanContactEmail: 'contact@territoiresentransitions.fr',
  importPlanContactRelance:
    "Nous vous informons dès que l'import est réalisé. Des questions pendant le remplissage, contactez nous.",
  importPlanRealiseEtapeTitre: "Une fois l'import réalisé",
  importPlanDemoPostImport: 'Suivez une démo post import',
  importPlanArticleProchainesEtapes:
    'Consultez notre article sur les prochaines étapes',
  importPlanVideoPresentation:
    "Visualisez une vidéo de présentation du fichier d'import",
  importPlanRendezVousEquipe:
    'Prenez un rendez-vous individuel avec notre équipe',
  labellisationAjouterDocumentsOfficielsCandidature:
    'Ajouter les documents officiels de candidature',
  labellisationCourrierActeCandidatureLabel: "Courrier d'acte de candidature",
  labellisationCourrierActeCandidatureDescription: ({
    referentielName,
  }: {
    referentielName: string;
  }): string =>
    ` : motivation et palier visé, précision des compétences, engagement à améliorer de façon continue la politique ${referentielName} et coordonnées de la personne référente technique`,
  labellisationArretePrefectoralEpciLabel:
    "Arrêté préfectoral de création de l'EPCI",
  labellisationArretePrefectoralEpciDescription:
    ' (Établissement public de coopération intercommunale)',
  labellisationDossierDemandeLabel: 'Dossier de demande de labellisation',
  labellisationDossierDemandeDescription:
    ' (et Request for Award pour les candidatures 5 étoiles)',
  labellisationAutresDocumentsAnnexesLabel: 'Autres documents annexes',
  labellisationAutresDocumentsAnnexesDescription:
    " si non renseignés dans la plateforme (programme politique - plan d'action, délibération de la politique climat air énergie, tableau de recueil des indicateurs...)",
  labellisationSignerActeEngagementDebut: 'Signer un ',
  labellisationActeEngagementLien: "acte d'engagement",
  labellisationActeEngagementAdhesion:
    ' dans le programme affirmant votre adhésion ',
  labellisationReglementDuLabel: 'au règlement du label',
  toucheShift: '⇧ SHIFT',
  toucheAlt: '⌥ ALT',
  tooltipReplierLignesDebut: 'Cliquer pour replier (tenir',
  tooltipMaintienEnfonce: 'enfoncé',
  tooltipReplierLignesFin: 'pour replier toutes les lignes de même niveau)',
  tooltipDeplierLignesDebut: 'Cliquer pour déplier (tenir',
  tooltipMaintienEnfoncePourDeplier: 'enfoncé pour déplier',
  tooltipDeplierMemeAxe: "toutes les lignes de même niveau de l'axe, ou tenir",
  tooltipDeplierTousAxes: 'enfoncé pour déplier aussi tous les axes)',
  indicateursDansCeGroupeCount: ({ count }: { count: number }): string =>
    `${count} indicateur${count > 1 ? 's' : ''} dans ce groupe`,
  sousIndicateurAjoutCount: ({ count }: { count: number }): string =>
    `+${count} sous-indicateur${count > 1 ? 's' : ''}`,
  participeAuScoreCae: 'Participe au score Climat Air Énergie',
  completerIndicateur: "Compléter l'indicateur",
  derniereValeurIndicateurModePrive:
    'La dernière valeur de cet indicateur est en mode privé',
  informationsDeMonCompte: 'Informations de mon compte',
  prenomEtNom: 'Prénom et nom',
  email: 'Email',
  numeroDeTelephone: 'Numéro de téléphone',
  emailEnAttenteConfirmation:
    'En attente de confirmation, consulter votre boîte mail.',
  confirmationEmailRenvoyerLien:
    "Si vous n'avez pas reçu le lien de confirmation par email, vous pouvez le renvoyer en cliquant sur ce lien :",
  comparezTrajectoireSnbcTitre:
    'Comparez la trajectoire SNBC à vos objectifs et vos résultats',
  comparezTrajectoireSnbcIntro: "Pour cela, il faut d'abord ",
  comparezTrajectoireSnbcActionReadonly:
    'faire compléter vos objectifs et vos résultats dans vos Indicateurs par un utilisateur en Edition ou Admin sur le profil de cette collectivité',
  comparezTrajectoireSnbcDetailsReadonly:
    ". L'utilisateur pourra appliquer les données disponibles en open data, ou bien renseigner ses propres données.",
  comparezTrajectoireSnbcActionEditeur:
    'compléter vos objectifs et vos résultats dans vos Indicateurs',
  comparezTrajectoireSnbcDetailsEditeur:
    ". Vous avez le choix d'appliquer les données disponibles en open data, ou bien de renseigner vos propres données.",
  completerMesIndicateurs: 'Compléter mes indicateurs',
  fichePartageeTitreSection: ({
    title,
    collectiviteNom,
  }: {
    title: string;
    collectiviteNom: string;
  }): string =>
    `${title} à la collectivité de ${collectiviteNom} qui partage cette action`,
  ficheActionPartageeParCollectivite: ({
    collectiviteNom,
    description,
  }: {
    collectiviteNom: string;
    description: string;
  }): string =>
    `Cette action vous a été partagée par la collectivité "${collectiviteNom}". ${description}`,
  vousSouhaitezDesAmeliorations: 'Vous souhaitez des améliorations ?',
  echangezAvecNous: 'Échangez avec nous',
  votreAvisFaconneLeProduit: '- Votre avis façonne le produit.',
  schedulerActionsSansDates:
    "Les actions n'ayant ni date de début, ni date de fin ne sont pas affichées",
  raccourcisSouris: 'Raccourcis pour utilisation à la souris',
  schedulerZoomer: 'Zoomer ou dé-zoomer →',
  schedulerDeplacement: 'Se déplacer dans le temps →',
  aide: 'Aide',
  fichierAjouteDirectementBibliotheque:
    'Ce fichier sera ajouté directement via votre bibliothèque de fichiers car il a déjà été téléversé',
  fichierSousLeNom: ' sous le nom ',
  fichierErreurTailleMax:
    'Ce fichier ne peut pas être téléversé car il dépasse la taille maximale autorisée',
  fichierErreurFormat:
    "Ce fichier ne peut pas être téléversé car son format n'est pas supporté",
  fichierErreurFormatEtTailleMax:
    "Ce fichier ne peut pas être téléversé car son format n'est pas supporté et il dépasse la taille maximale autorisée",
  fichierErreurTeleversement: "Ce fichier n'a pas pu être téléversé",
  listeReferentsProgrammeTete: 'Liste des référents du programme T.E.T.E',
  listeContacts: 'Liste des contacts',
  contact: 'Contact',
  fonction: 'Fonction',
  intituleDuPoste: 'Intitulé du poste',
  telephoneProfessionnel: 'Téléphone professionnel',
  copie: 'Copié !',
  copierEmail: "Copier l'email",
  diffuseurLabel: 'Diffuseur :',
  producteurLabel: 'Producteur :',
  versionLabel: 'Version :',
  methodologiePerimetreLabel: 'Méthodologie / Périmètre :',
  pointsAttentionLimitesLabel: "Points d'attention / Limites :",
  indicateurCalculeAutomatiquementMessage:
    'Indicateur calculé automatiquement à partir des données disponibles sur Territoires en Transitions.',
  rechercherParIntituleOuDescription: 'Rechercher par intitulé ou description',
  planDaction: "Plan d'action",
  resultatCount: ({ count }: { count: number }): string =>
    count <= 1 ? `${count} résultat` : `${count} résultats`,
  actionSelectionneeCount: ({ count }: { count: number }): string =>
    count <= 1
      ? `${count} action sélectionnée`
      : `${count} actions sélectionnées`,
  separateurPuce: ' • ',
  cguMiseAJourTitre: "Mise à jour des conditions générales d'utilisation",
  cguAccepterMessage:
    "Pour continuer à utiliser la plateforme territoiresentransitions.fr, nous vous invitons à accepter les conditions générales d'utilisation.",
  cguLireConditionsGenerales: 'Lire les conditions générales',
  cguAccepterEtPoursuivre: 'Accepter et poursuivre',
  invitationsEnAttente: 'Invitations en attente',
  adresseMail: 'Adresse mail',
  affichageDesReferentiels: 'Affichage des référentiels',
  choisirReferentielsAffichesEtatDesLieux:
    'Choisir les référentiels affichés dans le menu « État des lieux » pour cette collectivité.',
  reinitialiserSelonRemplissage: 'Réinitialiser selon le remplissage',
  reinitialiserSelonRemplissageDescription:
    'Affiche/cache automatiquement les référentiels CAE et ECI en fonction de leur remplissage.',
  selectionnerThematiqueAvantSousThematique:
    "Veuillez d'abord sélectionner une thématique pour pouvoir sélectionner une ou plusieurs sous-thématiques",
  annee: 'Année',
  total: 'TOTAL',
  uniteHt: 'HT',
  uniteEtp: 'ETP',
  collectiviteEngageePolitiqueAvecPreuves: ({
    referentielName,
  }: {
    referentielName: string;
  }): string =>
    `Être une collectivité engagée dans une politique ${referentielName} et le prouver (via les documents preuves ou un texte justificatif)`,
  sousActionOuTache: 'Sous-action ou tâche',
  statutOuScoreRequis: 'Statut ou score requis',
  oupsAucunResultat: 'Oups...',
  neCorrespondAVotreRecherche: 'ne correspond à votre recherche !',
  modifierFiltresPourPlusDeResultats:
    'Modifiez ou désactivez les filtres pour obtenir plus de résultats',
  rechercheGridAucuneCollectivite: 'aucune collectivité',
  rechercheGridAucunReferentiel: 'aucun référentiel',
  rechercheGridAucunPlan: 'aucun plan',
  openDataEtIndicateursCollectivite:
    '(open data et indicateurs renseignés par la collectivité)',
  indicateursRenseignesCount: ({ count }: { count: number }): string =>
    count > 1 ? 'indicateurs renseignés' : 'indicateur renseigné',
  plansCount: ({ count }: { count: number }): string =>
    count > 1 ? 'plans' : 'plan',
  etoilesCount: ({ count }: { count: number }): string =>
    count > 1 ? 'étoiles' : 'étoile',
  scoreRealiseIndicatif: 'réalisé courant',
  scoreProgrammeIndicatif: 'programmé',
  bibliothequeDeDocuments: 'Bibliothèque de documents',
  rapportsDeVisiteAnnuelle: 'Rapports de visite annuelle',
  documents: 'Documents',
  documentsAuditEtLabellisationReferentiel:
    "Documents d'audit et de labellisation - Référentiel ",
  etoile: 'étoile',
  auditContratObjectifTerritorialCOT:
    "Audit contrat d'objectif territorial (COT)",
  indicateurSelectionneCount: ({ count }: { count: number }): string =>
    count <= 1
      ? `${count} indicateur sélectionné`
      : `${count} indicateurs sélectionnés`,
  autresEmplacementsPourCetteActionCount: ({
    count,
  }: {
    count: number;
  }): string =>
    count > 1
      ? `${count} autres emplacements pour cette actions`
      : 'autre emplacement pour cette action',
  journalActivites: "Journal d'activités",
  creeeLe: 'Créée le',
  derniereModificationLe: 'Dernière modification le',
  sansType: 'Sans type',
  axeCount: ({ count }: { count: number }): string =>
    `${count} axe${count > 1 ? 's' : ''}`,
  sousAxeCount: ({ count }: { count: number }): string =>
    `${count} sous-axe${count > 1 ? 's' : ''}`,
  actionCount: ({ count }: { count: number }): string =>
    `${count} action${count > 1 ? 's' : ''}`,
  rapportGenerationEnCoursIntro:
    'Votre rapport est en cours de génération. Le traitement peut prendre quelques minutes selon le volume de données.',
  vousRecevrezEmailA: 'Vous recevrez un email à ',
  avecLienTelechargerRapport:
    " avec un lien pour télécharger votre rapport dès qu'il sera prêt.",
  joindreDocumentsLabellisationCNL:
    '* Pour passer en CNL penser à joindre les documents de labellisation.',
  quelTypeAuditSouhaitezVousDemander:
    "Quel type d'audit souhaitez-vous demander ?",
  envoyerMaDemande: 'Envoyer ma demande',
  auditEciTachesAvecPreuves:
    "Pour cet audit ECi, l'ensemble des tâches déclarées « faites » ou « détaillées » comprenant du « fait » doivent présenter des preuves téléchargées au niveau de la sous-action correspondante dans le référentiel.",
  aucunAuditeurDossierIncomplet:
    'Aucun auditeur ne pourra être attribué en cas de dossier incomplet.',
  auditCoutAdemeRespectComplétude:
    "Pour rappel, cet audit a un coût qui est aujourd'hui financé par l'ADEME. La validation de votre demande d'audit vous engage à respecter les conditions de complétude.",
  erreurRecuperationDonnees:
    'Une erreur est survenue lors de la récupération des données',
  aucunResultatCorrespondFiltres:
    'Aucun résultat ne correspond aux filtres sélectionnés',
  reconnaissanceObtenue: 'Reconnaissance obtenue',
  scoreRealise: 'Score réalisé',
  scoreProgramme: 'Score programmé',
  scoreRealiseLabel: 'Score réalisé :',
  dateDerniereLabellisation: 'Date de la dernière labellisation :',
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
  erreurChargementCriteres:
    'Erreur lors du chargement des critères de labellisation.',
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

  criteresAttendus: 'Critères attendus',
  reponses: 'Réponses',
  completudeCritere:
    'Renseigner les statuts de toutes les mesures du référentiel',
  completudeReponse: 'Ne plus avoir de statuts non renseignés',
  voirLaListe: 'Voir la liste',
  voirLaMesure: 'Voir la mesure',
  renseigner: 'Renseigner',
  chargement: 'Chargement…',
  scoreMinimumCritere: ({ seuilPercent }: { seuilPercent: number }): string =>
    `Atteindre un score réalisé (statut Fait) d'au moins ${seuilPercent} % et le prouver (via les documents preuves ou un texte justificatif)`,
  scoreMinimumReponse: ({ seuilPercent }: { seuilPercent: number }): string =>
    `${seuilPercent}% fait minimum`,

  reponseAvoirStatutFait: 'Avoir le statut à Fait',
  reponseAvoirStatutFaitOuProgramme: 'Avoir le statut à Fait ou Programmé',
  reponseAvoirPersonneRenseignee: 'Avoir au moins une personne renseignée',
  reponsePourcentageFaitMinimum: ({ percent }: { percent: number }): string =>
    `${percent}% fait minimum`,

  acteEngagementDescription:
    "Signer un acte d'engagement dans le programme affirmant votre adhésion au règlement du label.",
  acteEngagementDownloadLink: 'Télécharger le document à signer',
  acteEngagementReglementLink: 'Ouvrir le règlement du label',
  acteEngagementUploadButton: "Téléverser l'acte signé",
  remplacerLeFichier: 'Remplacer le fichier',
  televerserActeEngagementSigne: "Téléverser l'acte d'engagement signé",
  acteEngagementDepose: "Acte d'engagement déposé",
  acteEngagementNoDemandeError:
    'Aucune demande de labellisation en cours pour cette collectivité — le fichier ne peut pas être attaché.',

  documentsOfficielsCandidature: 'Documents officiels de candidature',
  dossierDemandeLabellisation:
    'Dossier de demande de labellisation (et Request for Award pour les candidatures 5 étoiles)',
  documentsAnnexes:
    "Autres documents annexes si non renseignés dans la plateforme (programme politique - plan d'action, délibération de la politique climat air énergie, tableau de recueil des indicateurs...)",
  courrierActeCandidature:
    "Courrier d'acte de candidature : motivation et palier visé, précision des compétences, engagement à améliorer de façon continue la politique, et coordonnées de la personne référente technique",
  arretePrefectoralEpci: "Arrêté préfectoral de création de l'EPCI",

  criteresLabellisationIntro:
    "Le premier niveau de labellisation ne nécessite pas d'audit et sera validé rapidement et directement par l'ADEME ! Les étoiles supérieures sont conditionnées à un audit réalisé par une personne experte mandatée par l'ADEME.",
  criteresLabellisationFelicitations: ({
    seuilPercent,
    etoileLabel,
  }: {
    seuilPercent: number;
    etoileLabel: string;
  }): string =>
    `Bravo, vous avez plus de ${seuilPercent} % d'actions réalisées ! Les critères ont été mis à jour pour préparer votre candidature à la ${etoileLabel} étoile.`,

  demandePremiereEtoile: 'Demande de première étoile',
  renseignerCriteresPourPremiereEtoile:
    'Renseigner tous les critères attendus afin de pouvoir demander la première étoile',
  tousCriteresRequisPourDemande:
    'Tous les critères présents au tableau doivent être complétés pour pouvoir faire la demande de première étoile.',
  premiereEtoileSansAudit:
    "Obtenir la première étoile (1er niveau de labellisation) ne nécessite pas d'audit et sera validé rapidement et directement par l'ADEME ! Les étoiles supérieures sont conditionnées à un audit réalisé par une personne experte mandatée par l'ADEME.",

  nouvelleVueChecklistTitre: 'Nouvelle vue de la checklist disponible',
  nouvelleVueChecklistDescription:
    "Une nouvelle vue tabulaire est disponible pour explorer la checklist d'audit et de labellisation. Vous pouvez la tester en avant-première.",
  nouvelleVueChecklistCta: 'Tester la nouvelle vue',
  monCompte: 'Mon compte',
  nombreDePointsInitial: 'Nombre de points initial',
  ouvrirLaMesure: 'Ouvrir la mesure',
  rejoindreUneCollectivite: 'Rejoindre une collectivité',

  urlNonValide: 'URL non valide',
  planNonTrouve: 'Plan non trouvé',

  suiviAvanceePlans: "Suivi de l'avancée des plans",
  voirTousLesPlans: 'Voir tous les plans',

  referentielPasEncoreRenseigne:
    "Ce référentiel n'est pas encore renseigné pour votre collectivité. Pour commencer à visualiser votre progression, mettez à jour les statuts des mesures.",
  auditEtLabellisation: 'Audit et labellisation',
  referentielNomme: (nom: string): string => `Référentiel ${nom}`,

  tableauDeBordPlansEtActions: 'Tableau de bord Plans & Actions',
  ajouterModulePersonnalise: 'Ajouter un module personnalisé',
  tableauDeBordDestinataires:
    "Ce tableau de bord est destiné à l'ensemble des personnes de la collectivité et peut être modifié par les administrateurs.",

  renseignerEtatDesLieux: "Renseigner l'état des lieux",
  aucuneDonneeDisponible: 'Aucune donnée disponible',
  evolutionScoreEnPoints: "L'évolution du score en points",

  nouvelleVueTableauDisponible: 'Une nouvelle vue tableau est disponible',
  decouvrirVueTabulaire: 'Découvrir la vue tabulaire',
  utiliseNouvelleVueTableauBeta:
    'Vous utilisez la nouvelle vue tableau (version bêta)',
  revenirVueGrille: 'Revenir à la vue Grille',

  presentationDesServices: 'Présentation des services',
  bienvenueCollectivite: ({
    prenom,
    collectiviteNom,
  }: {
    prenom: string;
    collectiviteNom: string;
  }): string =>
    `Bonjour ${prenom}, bienvenue sur le compte de la collectivité ${collectiviteNom}.`,
  retournerSurLeSite: 'Retourner sur le site',

  homeTitre: 'À vous de jouer !',
  homeIntroduction:
    "Territoires en Transitions est un service numérique gratuit et open source destiné à toutes les collectivités. Que vous soyez engagé ou non dans le programme Territoire Engagé Transition Écologique de l'ADEME, vous bénéficiez d'un espace de travail collaboratif pour piloter l'ensemble de vos plans d'actions et de vos indicateurs.",
  homeCreerCompte:
    "Créez votre compte en moins d'une minute, rejoignez le profil de votre collectivité et faites vos premiers pas sur la plateforme.",
  homeQuestionsChat:
    'Des questions ? Utilisez le chat en bas à droite de votre écran.',
  homeEnSavoirPlus: "En savoir plus sur l'outil",
  homeCtaCreerCompte: 'Créer un compte',
  homeCtaSeConnecter: 'Se connecter',
  homeImageAlt: 'interface territoires en transition',

  detailleStatutPourcentage: ({
    statut,
    percent,
  }: {
    statut: string;
    percent: number;
  }): string => `${statut}: ${percent} %`,

  et: 'et',
  aCompleter: 'à compléter',
  aCompleterMaj: 'À compléter',
  memeAnnee: 'La même année',
  memeAnneeRequiseParIndicateur:
    'pour les valeurs résultat et objectif doit être sélectionnée pour chaque indicateur.',
  renseignerDonneesIndicateurs: 'Renseigner les données des indicateurs',

  scoreIndicatifFait: (percent: string): string =>
    `Score indicatif Fait de ${percent}, basé sur`,
  scoreIndicatifProgramme: ({
    annee,
    percent,
  }: {
    annee: string | number;
    percent: string;
  }): string => `Score indicatif Fait en ${annee} de ${percent}, basé sur`,
  valeurDeLIndicateur: (titre?: string): string =>
    titre
      ? `la valeur de l'indicateur "${titre}" de`
      : "la valeur de l'indicateur de",
  valeurSelectionneePourPourcentageIndicatif: (avancement: string): string =>
    `Valeur sélectionnée pour le calcul du pourcentage indicatif ${avancement} :`,

  acteEngagementDocUrl: '/Acte_engagement.docx',
  reglementLabelUrl: ({
    referentielId,
  }: {
    referentielId: ReferentielId;
  }): string => {
    const filenameByReferentiel: Record<ReferentielId, string> = {
      cae: 'CAE_Reglement_label.pdf',
      eci: 'ECi_Reglement_label.pdf',
      // TODO produit : pas de règlement TE distinct pour l'instant, fallback CAE
      te: 'CAE_Reglement_label.pdf',
      'te-test': 'CAE_Reglement_label.pdf',
    };
    return `${SITE_URL}/fichiers/reglement/${filenameByReferentiel[referentielId]}`;
  },
} as const;
