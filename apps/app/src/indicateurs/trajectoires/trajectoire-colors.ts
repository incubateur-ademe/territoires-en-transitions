import { COULEURS_BY_SECTEUR } from '@/app/shared/secteurs/secteur-colors';
import { isTrajectoireSecteur } from '@tet/domain/indicateurs';
import { INDICATEURS_TRAJECTOIRE } from './trajectoire-constants';

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
