import { IndicateurGridShape } from '@/app/indicateurs/valeurs/grid/indicateur-grid-shape';

export const ENR_GRID_SHAPE: IndicateurGridShape = {
  Électrique: {
    Méthanisation: 'cae_3.aa',
    'Biomasse solide': 'cae_3.ab',
    'Solaire photovoltaïque': 'cae_3.ac',
    'Éolien terrestre': 'cae_3.ad',
    Hydrolien: 'cae_3.aq',
    Déchets: 'cae_3.ae',
  },
  Thermique: {
    Méthanisation: 'cae_3.af',
    'Biomasse solide': 'cae_3.ag',
    'Chaufferies bois': 'cae_3.ah',
    'Bois domestique': 'cae_3.ai',
    'Solaire thermique': 'cae_3.aj',
    'Géothermie profonde': 'cae_3.ak',
    'Géothermie de surface (PAC)': 'cae_3.am',
    'Aérothermie (PAC)': 'cae_3.an',
    Déchets: 'cae_3.ao',
    Autre: 'cae_3.ap',
  },
  Gaz: {
    Méthanisation: 'cae_3.c',
  },
};
