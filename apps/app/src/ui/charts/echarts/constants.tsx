export const LAYERS = {
  objectifs: { color: '#F5895B', label: 'Objectifs de la collectivité' },
  resultats: { color: '#6A6AF4', label: 'Résultats de la collectivité' },
  trajectoire: { color: '#1E98C6', label: 'Objectifs SNBC territorialisée' },
  moyenne: { color: '#41E6FF' },
  cible: { color: '#48A775' },
  seuil: { color: '#EB633E' },
};

export const PALETTE = [
  '#1CC272',
  '#91B2EE',
  '#EA27C2',
  '#FFCA79',
  '#F55B5B',
  '#9351CF',
  '#FFAF8B',
  '#2A2A62',
  '#48A775',
  '#EEAB2E',
  '#B55DDC',
  '#F4C447',
  '#4380F5',
  '#FE5000',
  '#929292',
];

export const PALETTE_LIGHT = [
  '#E1E1FD',
  '#96C7DA',
  '#D9D9D9',
  '#E4CDEE',
  '#FEF1D8',
  '#F7B1C2',
  '#C6C3E3',
  '#A4E7C7',
  '#FFD0BB',
  '#C3C3FB',
  '#EEEEEE',
  '#FFB595',
  '#D8EEFE',
  '#FBE7B5',
  '#B8D6F7',
];

export const COULEURS_BY_SECTEUR_IDENTIFIANT: {
  [indicateurKey: string]: string;
} = {
  'cae_1.c': '#FFD0BB', // Résidentiel
  'cae_1.d': '#FBE7B5', // Tertiaire
  'cae_1.i': '#F7B1C2', // Industrie
  'cae_1.k': '#B8D6F7', // Transports
  'cae_1.g': '#A4E7C7', // Agriculture
  'cae_1.h': '#C6C3E3', // Déchets
  'cae_1.j': '#D9D9D9', // Energie
  'cae_1.csc': '#FEF1D8', // CSC
  'cae_63.a': '#96C7DA', // UTCATF
  'cae_2.e': '#FFD0BB', // Résidentiel
  'cae_2.f': '#FBE7B5', // Tertiaire
  'cae_2.k': '#F7B1C2', // Industrie
  'cae_2.m': '#B8D6F7', // Transports
  'cae_2.i': '#A4E7C7', // Agriculture
  'cae_2.j': '#C6C3E3', // Déchets
  'cae_2.l_pcaet': '#D9D9D9', // Energie
};

export const EXTRA_SECTEUR_COLORS = [
  '#D8EEFE',
  '#E4CDEE',
  '#C3C3FB',
  '#FFB595',
  '#EEEEEE',
  '#E1E1FD',
];
