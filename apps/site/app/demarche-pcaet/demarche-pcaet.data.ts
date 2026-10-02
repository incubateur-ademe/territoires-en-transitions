import type { DemarchePcaetEtape } from '@tet/domain/demarches';

export const AIDE_DEMARCHE_PCAET_URL =
  'https://aide.territoiresentransitions.fr/fr/category/demarche-pcaet-1n536fa/';

export type EtapeDepot = {
  titre: string;
  detail: string;
  actions: string[];
  intervenants: string[];
};

/**
 * Mêmes étapes que le panneau « Avancement » de l'app : le typage sur
 * `DemarchePcaetEtape` casse la compilation si le domaine en ajoute une.
 */
const ETAPES_PAR_CLE = {
  elaboration: {
    titre: 'Élaboration',
    detail:
      "Vous constituez votre dossier directement dans la plateforme. Il est enregistré au fil de l'eau : vous pouvez le compléter en plusieurs fois et à plusieurs.",
    actions: [
      'Ajouter les documents attendus',
      'Compléter le diagnostic et les objectifs',
      "Renseigner le programme d'actions, ou l'importer depuis un PDF, un Word ou un Excel",
    ],
    intervenants: ['Collectivité', 'Équipes projet'],
  },
  transmis: {
    titre: 'Transmis pour avis',
    detail:
      'Une fois le dossier complet, vous le transmettez depuis la plateforme. Le conseil régional et le préfet de région sont informés et accèdent au dossier pour rendre leur avis.',
    actions: [
      'Vérifier que toutes les pièces sont présentes',
      'Transmettre le dossier pour avis',
      "Suivre l'état de la transmission",
    ],
    intervenants: ['Conseil régional', 'Préfet de région'],
  },
  finalisation: {
    titre: 'Consultation des avis et délibération',
    detail:
      "Les avis reçus sont rattachés à votre dossier. Vous en prenez connaissance, ajustez le plan si nécessaire, puis votre assemblée délibère pour l'adopter.",
    actions: [
      'Consulter les avis reçus',
      'Ajuster le plan si besoin',
      'Préparer la délibération',
    ],
    intervenants: ['Collectivité', 'Élus'],
  },
  publie: {
    titre: 'Adopté, publié et en cours de mise en œuvre',
    detail:
      "Vous déposez la délibération : le plan est adopté et publié. Votre programme d'actions devient votre outil de pilotage au quotidien.",
    actions: [
      'Déposer la délibération',
      "Suivre l'avancement des actions",
      'Renseigner les indicateurs et tableaux de bord',
    ],
    intervenants: ['Collectivité', 'Équipes projet', 'Élus'],
  },
  archive: {
    titre: 'Archivé',
    detail:
      "À l'échéance du plan ou lors d'un renouvellement, le plan est archivé. Documents, avis et historique restent consultables et servent de base au plan suivant.",
    actions: [
      'Consulter les documents et avis du plan',
      'Repartir de ce plan pour un renouvellement',
    ],
    intervenants: ['Collectivité'],
  },
} satisfies Record<DemarchePcaetEtape, EtapeDepot>;

export const ETAPES_DEPOT: EtapeDepot[] = Object.values(ETAPES_PAR_CLE);

export const QUESTIONS_FREQUENTES = [
  {
    question: 'Qui doit déposer un PCAET ?',
    reponse:
      "Les EPCI à fiscalité propre de plus de 20 000 habitants sont tenus d'élaborer un PCAET. Les autres collectivités peuvent s'engager volontairement et déposer leur plan sur la plateforme.",
  },
  {
    question: 'Quels documents dois-je fournir ?',
    reponse:
      "Le diagnostic, la stratégie et ses objectifs, le programme d'actions et le dispositif de suivi, ainsi que les pièces jointes demandées à l'étape « Élaboration ».",
  },
  {
    question: 'Le plan local de chaleur et de froid est-il pris en compte ?',
    reponse:
      "Oui. Lorsqu'une commune membre de votre EPCI compte plus de 45 000 habitants, le plan local de chaleur et de froid s'ajoute automatiquement aux pièces attendues, puisqu'il est intégré au PCAET. Dans le cas contraire, il ne vous est pas demandé.",
  },
  {
    question:
      'Un même document couvre plusieurs pièces : faut-il le déposer plusieurs fois ?',
    reponse:
      "Non. Pour les pièces concernées, par exemple une évaluation environnementale intégrée à votre document de PCAET, vous indiquez qu'elles sont incluses dans un document déjà déposé : elles sont alors considérées comme fournies.",
  },
  {
    question: "Puis-je importer mon programme d'actions existant ?",
    reponse:
      "Oui. Quel que soit son format (PDF, Word ou Excel), importez votre programme d'actions : en quelques minutes, la plateforme en reprend les actions pour constituer votre programme, prêt à être piloté. Plus besoin de tout ressaisir.",
  },
  {
    question:
      'Notre SCoT tient lieu de PCAET (SCoT-AEC) : comment le déposer ?',
    reponse:
      "Si votre collectivité porte la compétence SCoT, la plateforme vous demande au démarrage du dépôt si votre PCAET est un SCoT-AEC. Vous déposez alors un document unique valant schéma de cohérence territoriale et plan climat, identifié comme tel auprès des services de l'État. Ce choix reste modifiable jusqu'à la transmission pour avis.",
  },
  {
    question:
      'Notre PCAET a déjà été transmis pour avis en dehors de la plateforme : pouvons-nous le déposer ?',
    reponse:
      "Oui. Au démarrage du dépôt, indiquez que votre PCAET a déjà été transmis pour avis hors plateforme : vous arrivez directement à l'étape de finalisation pour déposer votre plan adopté. Vous y renseignez ensuite vos documents, votre diagnostic et votre programme d'actions. Ce choix est définitif.",
  },
  {
    question: 'Que se passe-t-il après la transmission pour avis ?',
    reponse:
      'Le conseil régional et le préfet de région rendent leur avis. Vous les consultez dans votre espace, puis votre collectivité délibère pour adopter le plan.',
  },
  {
    question:
      "Notre territoire s'étend sur plusieurs départements ou régions : qui reçoit le dossier ?",
    reponse:
      "À la transmission, les services de l'État de chacun de vos territoires sont saisis et accèdent au dossier. L'avis du préfet de région est rendu par la DREAL de la région de votre siège ; les services des autres territoires consultent le dossier sans se prononcer.",
  },
  {
    question: 'Pouvons-nous modifier notre plan après les avis ?',
    reponse:
      "Oui. Après réception des avis, vous mettez à jour les pièces que vous reprenez pour en tenir compte ; les autres restent dans leur version transmise. Vous déposez ensuite le mémoire de réponse et la délibération d'adoption.",
  },
  {
    question: 'Comment déposer un renouvellement de PCAET ?',
    reponse:
      "Depuis votre espace, créez un nouveau dépôt rattaché au plan précédent. Les documents et l'historique du premier plan restent accessibles.",
  },
  {
    question: 'Que se passe-t-il une fois le plan adopté ?',
    reponse:
      "Votre programme d'actions devient votre outil de pilotage pour les six ans du plan : suivi des actions, indicateurs et tableaux de bord. Le bilan à mi-parcours et l'évaluation finale se déposent aussi sur la plateforme ; le dépôt de l'évaluation finale clôt le cycle et archive le plan.",
  },
];
