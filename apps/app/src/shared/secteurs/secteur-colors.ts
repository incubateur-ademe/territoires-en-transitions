import { TrajectoireSecteursType } from '@tet/domain/indicateurs';

export const COULEURS_BY_SECTEUR: Record<
  TrajectoireSecteursType,
  `#${string}`
> = {
  Résidentiel: '#FFD0BB',
  Tertiaire: '#FBE7B5',
  Industrie: '#F7B1C2',
  Transports: '#B8D6F7',
  Agriculture: '#A4E7C7',
  Déchets: '#C6C3E3',
  'Branche énergie': '#D9D9D9',
  CSC: '#FEF1D8',
  UTCATF: '#48A775',
};
