import { ENV } from '@tet/api/environmentVariables';

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
 * Les étapes du panneau « Avancement » de l'app, à deux écarts près : la mise
 * en œuvre, fondue dans l'étape « publie » de l'app, est une étape à part
 * entière ici ; l'archivage n'est pas montré, il n'est pas un temps du dépôt.
 * Les intitulés sont tous des noms d'action, contrairement aux libellés de
 * l'app qui décrivent l'état du dossier.
 */
export const DEPOT_ETAPES: DepotEtape[] = [
  {
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
  {
    title: 'Transmission pour avis',
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
  {
    title: 'Consultation des avis et délibération',
    detail:
      "Les avis reçus sont rattachés à votre dépôt. Vous en prenez connaissance et ajustez des éléments si nécessaire. Puis votre assemblée délibère pour l'adopter.",
    actions: [
      'Consulter les avis reçus',
      'Ajuster des éléments si besoin',
      'Déposer la délibération',
    ],
    stakeholders: ['Collectivité', 'Élus'],
  },
  {
    title: 'Adoption et publication',
    detail:
      'Vous déposez la délibération : le plan est adopté et accessible au grand public sur la plateforme.',
    actions: ['Valider le dépôt final'],
    stakeholders: ['Collectivité', 'Élus'],
  },
  {
    title: 'Mise en œuvre et suivi',
    detail:
      "Le plan adopté vit sur la plateforme : vous suivez votre plan d'actions au quotidien, à l'appui d'indicateurs et en collaboration avec votre équipe, jusqu'aux bilans à mi-parcours et à l'échéance.",
    actions: [
      'Piloter vos actions',
      'Réaliser le bilan à mi-parcours',
      "Réaliser le bilan à l'échéance",
    ],
    stakeholders: ['Collectivité', 'Équipes projet'],
  },
];
