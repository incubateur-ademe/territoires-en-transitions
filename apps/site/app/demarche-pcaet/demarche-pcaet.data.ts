import { ENV } from '@tet/api/environmentVariables';
import {
  DEMARCHE_PCAET_ETAPES,
  type DemarchePcaetEtape,
} from '@tet/domain/demarches';

/**
 * Entrée du parcours de dépôt dans l'app. Le site ignore la collectivité de
 * l'utilisateur : l'app la résout après la connexion ou l'inscription. Le
 * `redirect_to` des pages d'authentification n'accepte qu'un chemin relatif.
 */
export const DEPOT_ENTRY_PATH = '/collectivite/demarche-pcaet';

/** Sans session, l'app redirige d'elle-même vers la connexion, puis revient ici. */
export const getDepotEntryUrl = () => `${ENV.app_url ?? ''}${DEPOT_ENTRY_PATH}`;

export const PCAET_HELP_URL =
  'https://aide.territoiresentransitions.fr/fr/category/demarche-pcaet-1n536fa/';

export type DepotEtape = {
  title: string;
  detail: string;
  actions: string[];
  stakeholders: string[];
};

/**
 * Mêmes étapes que le panneau « Avancement » de l'app : le typage sur
 * `DemarchePcaetEtape` casse la compilation si le domaine en ajoute une.
 * À n'importer que côté serveur : le domaine n'a rien à faire dans le bundle.
 */
const ETAPES_BY_KEY = {
  elaboration: {
    title: 'Élaboration',
    detail:
      "Vous constituez votre dossier directement dans la plateforme. Il est enregistré au fil de l'eau : vous pouvez le compléter en plusieurs fois et à plusieurs.",
    actions: [
      'Ajouter les documents attendus',
      'Compléter le diagnostic et les objectifs',
      "Renseigner le programme d'actions, ou l'importer depuis un PDF, un Word ou un Excel",
    ],
    stakeholders: ['Collectivité', 'Équipes projet'],
  },
  transmis: {
    title: 'Transmis pour avis',
    detail:
      'Une fois le dossier complet, vous le transmettez depuis la plateforme. Le conseil régional et le préfet de région sont informés et accèdent au dossier pour rendre leur avis.',
    actions: ["Suivre l'état de la transmission"],
    stakeholders: [
      'Collectivité',
      'Équipes projet',
      'Conseil régional',
      'Préfet de région',
    ],
  },
  finalisation: {
    title: 'Consultation des avis et délibération',
    detail:
      "Les avis reçus sont rattachés à votre dépôt. Vous en prenez connaissance et ajustez des éléments si nécessaire. Puis votre assemblée délibère pour l'adopter.",
    actions: [
      'Consulter les avis reçus',
      'Ajuster des éléments si besoin',
      'Préparer la délibération',
    ],
    stakeholders: ['Collectivité', 'Élus'],
  },
  publie: {
    title: 'Adopté, publié et en cours de mise en œuvre',
    detail:
      "Vous déposez la délibération : le plan est adopté et accessible au grand public. Vous pouvez utiliser la plateforme pour suivre votre plan d'actions au quotidien, à l'appui d'indicateurs et en collaboration avec votre équipe.",
    actions: [
      'Déposer la délibération',
      'Valider le dépôt final',
      "Suivre l'avancement des actions et indicateurs",
    ],
    stakeholders: ['Collectivité', 'Équipes projet', 'Élus'],
  },
  archive: {
    title: 'Archivé',
    detail:
      "À l'échéance du plan ou lors d'un renouvellement, le plan est archivé. Documents, avis et historique restent consultables.",
    actions: ['Consulter les documents et avis du plan'],
    stakeholders: ['Collectivité', 'Équipes projet'],
  },
} satisfies Record<DemarchePcaetEtape, DepotEtape>;

export const DEPOT_ETAPES: DepotEtape[] = DEMARCHE_PCAET_ETAPES.map(
  (etape) => ETAPES_BY_KEY[etape]
);
