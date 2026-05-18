import { IndicateurGridShape } from '@/app/indicateurs/valeurs/grid/indicateur-grid-shape';

export const PROFIL_ENERGIE_CLIMAT_GRID_SHAPE: IndicateurGridShape = {
  Résidentiel: {
    'Chauffage / Maisons individuelles': 'cae_1.ca',
    'Chauffage / Logement collectif': 'cae_1.cb',
    'Autres usages': 'cae_1.cc',
  },
  Tertiaire: {
    Chauffage: 'cae_1.da',
    'Autres usages': 'cae_1.db',
  },
  'Transport routier': {
    'Mobilité locale': 'cae_1.ea',
    Autre: 'cae_1.eb',
  },
  Agriculture: {
    Energie: 'cae_1.ga',
    Elevage: 'cae_1.gb',
    'Pratiques culturales': 'cae_1.gc',
  },
  Industrie: {
    'Métaux primaires': 'cae_1.ia',
    Chimie: 'cae_1.ib',
    'Non-métalliques': 'cae_1.ic',
    'Agro-industries': 'cae_1.id',
    Equipements: 'cae_1.ie',
    'Papier-carton': 'cae_1.if',
    'Autres industries': 'cae_1.ig',
  },
  Déchets: {
    Déchets: 'cae_1.h',
  },
};
