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
    question: 'Que se passe-t-il après la transmission pour avis ?',
    reponse:
      'Le conseil régional et le préfet de région rendent leur avis. Vous les consultez dans votre espace, puis votre collectivité délibère pour adopter le plan.',
  },
  {
    question: 'Comment déposer un renouvellement de PCAET ?',
    reponse:
      "Depuis votre espace, créez un nouveau dépôt rattaché au plan précédent. Les documents et l'historique du premier plan restent accessibles.",
  },
];
