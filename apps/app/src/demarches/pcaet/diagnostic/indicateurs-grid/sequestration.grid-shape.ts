import { IndicateurGridShape } from '../../../../indicateurs/valeurs/grid/indicateur-grid-shape';

export const SEQUESTRATION_GRID_SHAPE: IndicateurGridShape = {
  Forêts: {
    Forêts: 'cae_63.b',
  },
  'Terres agricoles': {
    Cultures: 'cae_63.ca',
    Prairies: 'cae_63.cb',
    Vignes: 'cae_63.cc',
    Vergers: 'cae_63.cd',
  },
  'Autres sols': {
    'Zones humides': 'cae_63.da',
    'Sols artificiels': 'cae_63.db',
  },
  'Produits bois': {
    'Produits bois': 'cae_63.e',
  },
};
