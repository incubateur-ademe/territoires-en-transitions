import type { IndicateurValeurField } from '@/app/indicateurs/valeurs/grid/types';

export type PeriodeCommentaires = Readonly<
  Record<IndicateurValeurField, string>
>;

export const NO_COMMENTAIRES: PeriodeCommentaires = {
  resultat: '',
  objectif: '',
};

export const countCommentaires = ({
  resultat,
  objectif,
}: PeriodeCommentaires): number =>
  [resultat, objectif].filter((commentaire) => commentaire !== '').length;
