import {
  isTrajectoireSecteur,
  TrajectoireSecteursType,
} from '@tet/domain/indicateurs';
import { INDICATEURS_TRAJECTOIRE } from './trajectoire-constants';

export const COULEURS_BY_SECTEUR: Record<TrajectoireSecteursType, string> = {
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

export const COULEURS_BY_SECTEUR_IDENTIFIANT = {
  ...INDICATEURS_TRAJECTOIRE['emissions_ges'].secteurs.reduce(
    (acc, secteur) => {
      acc[secteur.identifiant] = isTrajectoireSecteur(secteur.nom)
        ? COULEURS_BY_SECTEUR[secteur.nom]
        : '';
      return acc;
    },
    {} as Record<string, string>
  ),
  ...INDICATEURS_TRAJECTOIRE['consommations_finales'].secteurs.reduce(
    (acc, secteur) => {
      acc[secteur.identifiant] = isTrajectoireSecteur(secteur.nom)
        ? COULEURS_BY_SECTEUR[secteur.nom]
        : '';
      return acc;
    },
    {} as Record<string, string>
  ),
};

export const EXTRA_SECTEUR_COLORS = [
  '#D8EEFE',
  '#E4CDEE',
  '#C3C3FB',
  '#FFB595',
  '#EEEEEE',
  '#E1E1FD',
];
