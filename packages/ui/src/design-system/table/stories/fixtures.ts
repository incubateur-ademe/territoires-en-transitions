export type FakeVueTabulaireAction = {
  statut: string;
  title?: string;
  description?: string;
  pilotes?: string[];
  dateDeFin?: string;
};

export const fakeVueTabulaireData: FakeVueTabulaireAction[] = [
  {
    title:
      'Organiser des événements de sensibilisation aux enjeux de la rénovation énergétique auprès de la population',
    description:
      'Cette action *englobe* 4 dispositifs différents de sensibilisation aux enjeux de la rénovation énergétique, pouvant être déployés par Alisée selon les besoins des communes',
    statut: 'En cours',
    pilotes: ['Yolo dodo'],
    dateDeFin: '20/10/2026',
  },
  {
    title: 'Développer le photovoltaïque sur les toitures',
    description:
      'Identifier et accompagner les projets sur les bâtiments publics (écoles, gymnases, piscines, etc.)',
    statut: 'À venir',
    pilotes: ['Yolo dodo'],
    dateDeFin: '01/06/2027',
  },
  {
    title:
      "1.3.4 - Soutenir l'émergence et le développement de projets de méthanisation vertueux",
    statut: 'En cours',
    dateDeFin: '31/12/2029',
  },
  {
    title: "Améliorer l'efficacité énergétique des logements sociaux",
    description:
      "Mise en place d'audits énergétiques et de travaux de rénovation dans les logements sociaux.",
    statut: 'En cours',
    pilotes: ['EcoRénov'],
    dateDeFin: '15/03/2028',
  },
  {
    title: 'Sensibiliser les entreprises aux énergies renouvelables',
    description:
      "Organisation de séminaires pour les entreprises sur l'utilisation des énergies renouvelables.",
    statut: 'À venir',
    pilotes: ['GreenBiz'],
    dateDeFin: '30/09/2027',
  },
  {
    title: 'Promouvoir les transports en commun écologiques',
    description:
      "Développement d'une campagne de communication sur les avantages des transports en commun durables.",
    statut: 'En cours',
    pilotes: ['Transports Verts'],
    dateDeFin: '01/12/2026',
  },
  {
    title: 'Éduquer les jeunes sur le changement climatique',
    description:
      "Création d'un programme éducatif pour les écoles sur le changement climatique et ses conséquences.",
    statut: 'À venir',
    pilotes: ['Ecole Verte'],
    dateDeFin: '01/09/2028',
  },
  {
    title: 'Développer des projets de recyclage dans les quartiers',
    description:
      'Implémentation de points de collecte et de sensibilisation au recyclage.',
    statut: 'En cours',
    pilotes: ['Recyclage Now'],
    dateDeFin: '30/04/2027',
  },
  {
    title: "Encourager l'agriculture urbaine",
    description:
      "Mise en place de jardins partagés et de programmes d'agriculture urbaine.",
    statut: 'À venir',
    pilotes: ['AgriCity'],
    dateDeFin: '15/07/2027',
  },
  {
    title: 'Instaurer des zones piétonnes dans le centre-ville',
    description:
      'Création de zones piétonnes pour réduire la pollution et améliorer la qualité de vie.',
    statut: 'En cours',
    pilotes: ['Ville Verte'],
    dateDeFin: '20/10/2025',
  },
  {
    title: "Promouvoir l'économie circulaire",
    description:
      "Sensibilisation et formation sur les pratiques de l'économie circulaire.",
    statut: 'À venir',
    pilotes: ['Circulaire Partners'],
    dateDeFin: '01/01/2029',
  },
  {
    title:
      "Rénovation des infrastructures sportives pour l'efficacité énergétique",
    description:
      "Rénover les infrastructures sportives pour qu'elles soient plus écoénergétiques.",
    statut: 'En cours',
    pilotes: ['Sport Écologique'],
    dateDeFin: '31/12/2028',
  },
  {
    title: "Soutenir l'efficacité énergétique dans l'industrie",
    description:
      'Accompagnement des industries dans leur transition vers des méthodes plus efficaces.',
    statut: 'À venir',
    pilotes: ['Industrie Verte'],
    dateDeFin: '15/06/2029',
  },
  {
    title: 'Créer des espaces verts dans les zones urbaines',
    description:
      "Aménagement d'espaces verts pour améliorer la biodiversité et le cadre de vie.",
    statut: 'En cours',
    pilotes: ['Villes en Fleurs'],
    dateDeFin: '30/09/2026',
  },
  {
    title: "Développer des applications pour le suivi de l'énergie",
    description:
      "Création d'applications mobiles pour aider les citoyens à suivre leur consommation énergétique.",
    statut: 'À venir',
    pilotes: ['Tech for Green'],
    dateDeFin: '01/04/2028',
  },
  {
    title: 'Renforcer les politiques de gestion des déchets',
    description:
      'Mise en place de nouvelles politiques pour une meilleure gestion des déchets.',
    statut: 'En cours',
    pilotes: ['Déchets Zéro'],
    dateDeFin: '31/12/2027',
  },
  {
    title: 'Créer un réseau de bornes de recharge pour véhicules électriques',
    description:
      'Installation de bornes de recharge dans les zones urbaines et rurales.',
    statut: 'En cours',
    pilotes: ['Recharge Plus'],
    dateDeFin: '01/07/2027',
  },
  {
    title: 'Organiser des ateliers de compostage pour les citoyens',
    description:
      'Sensibilisation et formation des citoyens sur les techniques de compostage.',
    statut: 'À venir',
    pilotes: ['Compost Citoyen'],
    dateDeFin: '15/05/2028',
  },
  {
    title: 'Lancer un programme de covoiturage intercommunal',
    description:
      'Mise en place d’une plateforme pour faciliter le covoiturage entre communes.',
    statut: 'En cours',
    pilotes: ['Covoit Local'],
    dateDeFin: '30/11/2026',
  },
  {
    title: 'Créer des fermes verticales dans les zones urbaines',
    description:
      'Développement de fermes verticales pour produire des aliments localement.',
    statut: 'À venir',
    pilotes: ['Urban Farms'],
    dateDeFin: '01/10/2028',
  },
  {
    title: 'Mettre en place des systèmes de récupération des eaux de pluie',
    description:
      'Installation de systèmes pour collecter et réutiliser les eaux de pluie.',
    statut: 'En cours',
    pilotes: ['Eau Durable'],
    dateDeFin: '31/08/2027',
  },
  {
    title: 'Développer des programmes de formation en énergies renouvelables',
    description:
      'Formation des professionnels aux technologies des énergies renouvelables.',
    statut: 'À venir',
    pilotes: ['Formation Verte'],
    dateDeFin: '01/02/2029',
  },
];

export const fakeStatusOptions = [
  { value: 'option1', label: 'À venir' },
  { value: 'option2', label: 'En cours' },
  {
    value: 'option3',
    label: 'En finalisation avant publication',
  },
  { value: 'option4', label: 'Publié' },
  { value: 'option5', label: 'Retiré' },
  { value: 'option6', label: 'En révision' },
  { value: 'option7', label: 'Annulé' },
];
