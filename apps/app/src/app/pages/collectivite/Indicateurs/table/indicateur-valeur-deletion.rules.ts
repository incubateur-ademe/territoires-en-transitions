import type { PreparedValue } from '../data/prepare-data';

type DeletableIndicateurValue = Pick<
  PreparedValue,
  'objectif' | 'resultat' | 'objectifCommentaire' | 'resultatCommentaire'
>;

export const shouldConfirmValueDeletion = (
  valeur: DeletableIndicateurValue
): boolean =>
  typeof valeur.objectif === 'number' ||
  typeof valeur.resultat === 'number' ||
  Boolean(valeur.resultatCommentaire) ||
  Boolean(valeur.objectifCommentaire);
