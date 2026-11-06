import { plural } from '@tet/ui/labels/plural';

export const utilisateursAndEntityLabels = {
  /** Rôles et permissions */
  roleSuperAdmin: 'Super Admin',
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

  /** Fonctions */
  membreFonctionTechnique: 'Directions et services techniques',
  membreFonctionPolitique: 'Équipe politique',
  membreFonctionConseiller: "Bureau d'études",
  membreFonctionPartenaire: 'Partenaire',

  membreTeteFonctionTechnique: 'Responsable technique',
  membreTeteFonctionPolitique: 'Personne élue',
  membreTeteFonctionConseiller: 'Conseiller ou conseillère',
  membreTeteFonctionPartenaire: 'Partenaire',

  /** Entités */
  pilote: plural({ one: 'Pilote', other: 'Pilotes' }),

  personnePilote: plural({
    one: 'Personne pilote',
    other: 'Personnes pilotes',
  }),
  personnePiloteSans: 'Sans personne pilote',
  personnePiloteSelectOrCreatePlaceholder: (isEditionAllowed: boolean) =>
    `Sélectionner ${isEditionAllowed ? 'ou créer ' : ''}une personne pilote`,
  personnePiloteAjouter: 'Ajouter une personne pilote',
  personnePiloteEditer: 'Éditer la personne pilote',
  personnePiloteDissocier: 'Dissocier une personne pilote',

  referentTechnique: plural({
    one: 'Responsable technique',
    other: 'Responsables techniques',
  }),

  personneElue: plural({
    one: 'Personne élue',
    other: 'Personnes élues',
  }),
  personneElueSelectOrCreatePlaceholder:
    'Sélectionner ou créer une personne élue',
  personneElueSelectPlaceholder: 'Sélectionner une personne élue',
  personneElueEditer: 'Éditer la personne élue',
  personneElueAjouter: 'Ajouter une personne élue',
  personneElueDissocier: 'Dissocier une personne élue',

  directionOuServicePilote: plural({
    one: 'Direction ou service pilote',
    other: 'Directions ou services pilotes',
  }),
  directionOuServicePiloteSans: 'Sans direction ou service pilote',
  servicePiloteSans: 'Sans service pilote',
  servicePilote: plural({
    one: 'Service pilote',
    other: 'Services pilotes',
  }),
  directionOuServicePilotePlaceholderSelectionner: (
    isEditionAllowed: boolean
  ) =>
    `Sélectionner ${
      isEditionAllowed ? 'ou créer ' : ''
    }une direction ou service pilote`,
  directionOuServicePiloteEditer: 'Éditer la direction ou service pilote',
  directionOuServicePiloteAjouter: 'Ajouter une direction ou service pilote',
  directionOuServicePiloteDissocier:
    'Dissocier une direction ou service pilote',

  cibleGrandPublic: 'Grand public',
  cibleAssociations: 'Associations',
  ciblePublicScolaire: 'Public scolaire',
  cibleActeursEconomiques: 'Acteurs économiques',
  cibleActeursEconomiquesPrimaire: 'Acteurs économiques du secteur primaire',
  cibleActeursEconomiquesSecondaire:
    'Acteurs économiques du secteur secondaire',
  cibleActeursEconomiquesTertiaire: 'Acteurs économiques du secteur tertiaire',
  ciblePartenaires: 'Partenaires',
  cibleAutresCollectivites: 'Autres collectivités du territoire',
  cibleCollectiviteElleMeme: 'Collectivité elle-même',
  cibleElusLocaux: 'Élus locaux',
  cibleAgents: 'Agents',
  ciblePlaceholderSelectionner: 'Sélectionner une ou plusieurs cibles',

  acteur: plural({ one: 'Acteur', other: 'Acteurs' }),

  /** Gestion des utilisateurs */
  inviterMembre: 'Inviter une personne',
  annulerInvitation: "Annuler l'invitation",
  renvoyerInvitation: "Renvoyer l'invitation",
  invitationDescription:
    'Cette personne ne pourra pas rejoindre les membres de votre collectivité.',
  associerCompteTag: 'Associer ce compte utilisateur à un tag',
  associerCompteTagDescription:
    'Associer cette personne à un ou plusieurs tags afin de lui associer des actions, des indicateurs et des mesures.',
  associerCompteTagChamp: 'Associer cette personne à un ou plusieurs tags',

  // Page de consentement OAuth (connecteurs MCP : Claude.ai, Claude Desktop…)
  oauthConsentTitre: "Autoriser l'accès à Territoires en Transitions",
  oauthConsentDescription: (clientName: string) =>
    `${clientName} demande à interroger les données analytiques de Territoires en Transitions en votre nom.`,
  oauthConsentReserveEquipe:
    "Cet accès est réservé à l'équipe : il ne fonctionnera qu'avec un compte support.",
  oauthConsentRedirection: (redirectUri: string) =>
    `Après votre choix, vous serez redirigé vers ${redirectUri}.`,
  oauthConsentCompte: (email: string) => `Connecté en tant que ${email}.`,
  oauthConsentAutoriser: 'Autoriser',
  oauthConsentRefuser: 'Refuser',
  oauthConsentChargement: 'Vérification de la demande…',
  oauthConsentAbsent:
    "Aucune demande d'autorisation à afficher : revenez depuis l'application qui demande l'accès.",
  oauthConsentErreur:
    "La demande d'autorisation est invalide ou expirée. Relancez la connexion depuis l'application qui demande l'accès.",

  // Assistant TeT (dans l'app, connecteur MCP pour Claude, /tet dans Crisp)
  assistantTitre: 'Assistant TeT',
  assistantBadgeSupport: 'Support',
  assistantBadgeReserveSupport: 'Réservé au support',
  assistantBadgeLectureSeule: 'Lecture seule, sauf segments Crisp (support)',
  assistantCarteResume:
    "Interrogez la plateforme depuis Claude, en français : fiche d'un utilisateur ou d'une collectivité, suivi PCAET, scores des référentiels, statistiques d'usage. L'assistant applique vos droits et cite la source de chaque chiffre.",
  assistantConfigurer: "Configurer l'assistant",
  assistantVoirExemples: 'Voir les exemples de questions',
  assistantEtatConnecte: 'Connecté',
  assistantEtatNonConnecte: 'Non connecté',
  assistantEtatNonConnecteDetail: '3 minutes pour brancher Claude',
  assistantEtatAutoriseLe: (date: string) => `autorisé le ${date}`,
  assistantEtatIndisponible:
    "L'état de la connexion n'est pas disponible pour le moment.",
  assistantIntro:
    "Posez vos questions sur la plateforme en français. L'assistant lit les données et cite la source de chaque chiffre ; la seule écriture possible, l'ajout d'un segment à des conversations Crisp, est réservée au rôle support et se confirme d'un clic. Il s'utilise de trois façons, indépendantes les unes des autres.",
  assistantOngletPresentation: 'Présentation',
  assistantOngletClaude: 'Claude',
  assistantOngletCrisp: 'Crisp',
  assistantOngletApp: 'Assistant inApp',
  assistantUsageAppTitre: "Dans l'app",
  assistantUsageAppBadge: 'Rien à installer',
  assistantUsageAppDescription:
    "Discutez avec l'assistant sans quitter la plateforme, comme avec Claude : statistiques, fiches, PCAET, et désormais les conversations du support (volume, retours, temps passé sur un sujet). Il vous demande de préciser quand c'est flou et vous propose des choix. Animé par Albert, le modèle de l'État.",
  assistantUsageAppLien: "Ouvrir l'assistant",
  assistantChatTitre: "Discuter avec l'assistant",
  assistantChatDescription:
    "Animé par Albert, le modèle de l'État. Rien n'est conservé : la conversation disparaît quand vous quittez la page.",
  assistantChatPlaceholder:
    'Posez votre question (Entrée pour envoyer, Maj + Entrée pour aller à la ligne)',
  assistantChatEnvoyer: 'Envoyer',
  assistantChatNouvelleConversation: 'Nouvelle conversation',
  assistantChatReflexion: "L'assistant cherche… (de 10 secondes à une minute)",
  assistantChatErreur: (message: string) =>
    `L'assistant n'a pas pu répondre : ${message}`,
  assistantChatVous: 'Vous',
  assistantChatAssistant: 'Assistant',
  assistantChatActionTitre: 'Écriture à confirmer',
  assistantChatConversationCrisp: plural({
    one: 'conversation Crisp créée',
    other: 'conversations Crisp créées',
  }),
  assistantChatActionAjoutSegment: ({
    segment,
    conversations,
    dateFrom,
    dateTo,
  }: {
    segment: string;
    conversations: string;
    dateFrom: string;
    dateTo: string;
  }) =>
    `Ajouter le segment « ${segment} » à ${conversations} du ${dateFrom} au ${dateTo}.`,
  assistantChatActionNouveauSegment:
    "Ce segment n'existe pas encore dans Crisp : il sera créé.",
  assistantChatActionDejaTaguees: plural({
    one: 'conversation du filtre a déjà ce segment.',
    other: 'conversations du filtre ont déjà ce segment.',
  }),
  assistantChatActionConfirmer: 'Confirmer',
  assistantChatActionAnnuler: 'Annuler',
  assistantChatActionAnnulee: "Annulé : rien n'a été écrit.",
  assistantChatActionReserveeSupport:
    'Réservé au rôle support : le mode super-admin ne suffit pas pour écrire.',
  assistantChatActionResultat: ({
    segment,
    ajoutes,
    dejaPresents,
    echecs,
  }: {
    segment: string;
    ajoutes: number;
    dejaPresents: number;
    echecs: number;
  }) =>
    `Segment « ${segment} » : ${ajoutes} ajout(s), ${dejaPresents} déjà présent(s), ${echecs} échec(s).`,
  assistantChatActionErreur: (message: string) =>
    `L'ajout a échoué : ${message}`,
  assistantUsageClaudeTitre: 'Dans Claude',
  assistantUsageClaudeBadge: 'À configurer une fois',
  assistantUsageClaudeDescription:
    "Vous branchez le connecteur sur votre compte, puis vous discutez librement : fiches, PCAET, scores, statistiques, modèles de prompt. C'est l'usage le plus large, mais il demande trois étapes, décrites dans l'onglet Claude.",
  assistantUsageClaudeLien: 'Brancher Claude',
  assistantUsageCrispTitre: 'Dans Crisp',
  assistantUsageCrispBadge: 'Rien à installer',
  assistantUsageCrispDescription:
    "Un utilisateur écrit au support parce que quelque chose bloque ? Tapez /tet en note privée dans la conversation : l'assistant cherche l'explication dans son compte et vous propose une piste de réponse. Rien à installer, et indépendant du connecteur Claude.",
  assistantUsageCrispLien: 'Voir les commandes',
  assistantConnexionTitre: 'Se connecter dans Claude',
  assistantConnexionDescription:
    'Ces trois étapes ne concernent que Claude. Les commandes Crisp fonctionnent sans elles.',
  assistantEtapeAjouterTitre: 'Ajouter le connecteur dans Claude',
  assistantEtapeAjouterDescription:
    "Dans Claude (claude.ai ou l'application Claude) : Paramètres › Connecteurs › Ajouter un connecteur personnalisé, puis collez cette adresse.",
  assistantAdresseConnecteur: 'Adresse du connecteur',
  assistantCopierAdresse: "Copier l'adresse",
  assistantEtapeAutoriserTitre: "Autoriser l'accès",
  assistantEtapeAutoriserDescription:
    "Connectez-vous avec votre compte Territoires en Transitions, puis autorisez l'accès. L'assistant applique exactement vos droits : il ne voit que ce que vous voyez dans la plateforme.",
  assistantEtapeSuperAdminTitre:
    "Pour une collectivité dont vous n'êtes pas membre",
  assistantEtapeSuperAdminDescription:
    "Activez le mode super-admin, puis reposez votre question à l'assistant. Sans cela, il répondra qu'il n'a pas accès à cette collectivité.",
  assistantModeSuperAdmin: 'Mode super-admin',
  assistantModeSuperAdminActif: 'Actif',
  assistantModeSuperAdminInactif: 'Inactif',
  assistantModeSuperAdminAide: 'Activez-le depuis la barre en bas de page.',
  assistantExemplesTitre: 'Ce que vous pouvez lui demander',
  assistantExemplesDescription:
    "Posez vos questions en langage courant : l'assistant choisit lui-même la requête et vous la montre.",
  assistantExemplesColonneDomaine: 'Domaine',
  assistantExemplesColonneQuestions: 'Exemples de questions',
  assistantExemples: [
    {
      domaine: 'Un utilisateur',
      questions: [
        '« Qui est jean.dupont@ville.fr et à quelles collectivités a-t-il accès ? »',
        "« Qu'a-t-il fait sur la plateforme ces 15 derniers jours ? »",
        '« Il ne voit pas le plan de sa collectivité, pourquoi ? »',
      ],
    },
    {
      domaine: 'Une collectivité',
      questions: [
        '« Fais-moi la fiche de la CC du Pays de Gex : type, population, COT. »',
        "« Quels sont ses plans d'action et lesquels sont actifs ? »",
      ],
    },
    {
      domaine: 'Le suivi PCAET',
      questions: [
        "« Où en est le PCAET de Clisson Sèvre et Maine ? Qui le pilote, qu'est-ce qui manque pour le transmettre ? »",
      ],
    },
    {
      domaine: 'Les référentiels',
      questions: [
        '« Quel est le score CAE de Grenoble-Alpes Métropole et comment a-t-il évolué ? »',
      ],
    },
    {
      domaine: 'Les statistiques de la plateforme',
      questions: [
        '« Combien de collectivités sont activées, par catégorie ? »',
        "« Combien de plans d'action sont actifs sur 52 semaines ? »",
        '« Quelles sont les 3 collectivités les plus actives ce trimestre ? »',
        "« Combien de collectivités sont labellisées, par niveau d'étoiles ? »",
      ],
    },
    {
      domaine: 'Les conversations du support (Crisp)',
      questions: [
        '« Combien de demandes sur le référentiel CR depuis août, de quels types, et combien de temps y avons-nous passé ? »',
        '« Que disent les usagers qui nous écrivent sur le référentiel CR ? »',
        "« Ajoute le segment besoin_guidage_referentiel_cr aux conversations d'octobre qui parlent du nouveau référentiel. »",
      ],
      note: "Le temps passé est une estimation. L'ajout de segment se fait dans l'onglet Assistant inApp, pour le rôle support, après confirmation.",
    },
    {
      domaine: "L'usage du produit",
      questions: [
        '« Quelles pages ont été les plus consultées ces 30 derniers jours ? »',
        "« Combien d'exports ont été faits ce mois-ci ? »",
      ],
    },
    {
      domaine: 'Formaliser un besoin',
      questions: [
        '« Esquisse : relancer les collectivités inactives depuis 6 mois »',
      ],
      note: "Avec le modèle « Formaliser une esquisse (Shape Up) », l'assistant chiffre le problème.",
    },
  ],
  assistantModelesTitre: 'Modèles de prompt disponibles dans Claude',
  assistantModelesDescription:
    'Bouton « + » dans la zone de saisie, puis le connecteur Territoires en Transitions.',
  assistantModeles: [
    {
      titre: 'Analyser des statistiques de la plateforme',
      description:
        "Cadre la question, choisit la bonne requête et commente l'évolution.",
    },
    {
      titre: 'Répondre au support sur une conversation',
      description:
        "Part d'une conversation et remonte le contexte de l'utilisateur.",
    },
    {
      titre: 'Formaliser une esquisse (Shape Up)',
      description: "Le problème est chiffré avant d'être cadré.",
    },
  ],
  assistantCrispTitre: 'Depuis Crisp',
  assistantCrispDescription:
    'Quand un utilisateur écrit au support parce que quelque chose bloque, /tet vous aide à comprendre pourquoi et à lui répondre.',
  assistantCrispFonctionnement:
    "L'assistant lit le compte de l'utilisateur de la conversation (droits, collectivités, plans, suivi PCAET, activité récente) et ses derniers messages, puis propose une explication et une piste de réponse. Inutile de lui dire de qui il s'agit.",
  assistantCrispExemplesTitre: 'Par exemple :',
  assistantCrispExemples: [
    "/tet pourquoi n'arrive-t-il pas à transmettre son PCAET ?",
    '/tet pourquoi ne voit-il pas le plan de sa collectivité ?',
    '/tet que lui répondre ?',
  ],
  assistantCrispPrerequis:
    "Il suffit d'un compte Territoires en Transitions support sous la même adresse e-mail que votre compte Crisp. Ni le mode super-admin ni le connecteur Claude ne sont nécessaires.",
  assistantCrispNotePrivee: 'En note privée sur une conversation :',
  assistantCrispCommandes: [
    {
      commande: '/tet',
      description: 'résume la conversation.',
    },
    {
      commande: '/tet <question>',
      description: 'pose une question précise sur le problème rencontré.',
    },
  ],
  assistantCrispReponse:
    "La réponse arrive en note privée, visible du support seulement, rédigée avec Albert, le modèle de l'État. Relisez-la avant de répondre à l'utilisateur.",
  assistantASavoirTitre: 'À savoir',
  assistantASavoir: [
    {
      titre: 'Presque en lecture seule',
      description:
        "L'assistant ne peut ni rattacher un utilisateur, ni changer un droit, ni modifier une donnée de la plateforme. Seule exception, dans l'onglet Assistant inApp : ajouter un segment à des conversations Crisp, pour le rôle support, après votre confirmation.",
    },
    {
      titre: 'Fraîcheur des données',
      description:
        "Les statistiques datent de la veille. La fiche d'un utilisateur, d'une collectivité ou d'un PCAET est à jour.",
    },
    {
      titre: 'Chaque chiffre est sourcé',
      description:
        "Il vient d'une requête que l'assistant cite : en cas de doute, demandez-lui la requête.",
    },
    {
      titre: 'Périmètre des statistiques',
      description:
        'Les utilisateurs internes et les collectivités de test en sont exclus.',
    },
  ],
  assistantDroitsTitre: "Vos droits s'appliquent",
  assistantDroitsDescription:
    "L'assistant interroge la plateforme en votre nom. Il ne voit ni plus ni moins que vous, et le mode super-admin agit sur lui comme sur l'interface.",

  /** Administration */
  administration: 'Administration',
  administrationSousTitre:
    "Outils internes réservés à l'équipe de la plateforme",
  administrationOutilsPlateforme: 'Plateforme',
  administrationOutilsCollectivite: (nom: string): string =>
    `Collectivité : ${nom}`,
  administrationImporterPlanDescription:
    "Importer le plan d'action d'une collectivité depuis un fichier Excel",
  administrationAjouterCollectiviteDescription:
    'Créer une collectivité absente de TeT',
  administrationBanniereDescription:
    'Afficher un message à tous les utilisateurs de TeT',
  administrationModifierCollectiviteDescription:
    'Modifier les informations de la collectivité',
  administrationAffichageReferentielsDescription:
    "Choisir les référentiels affichés et leur mode d'accès",
  administrationActionsDeReferenceDescription:
    'Consulter et modifier les actions de référence',
  administrationGestionLabellisations: 'Gestion des labellisations',
  administrationGestionLabellisationsDescription:
    "Suivre les dossiers d'audit, de labellisation et les COT des collectivités",
};
