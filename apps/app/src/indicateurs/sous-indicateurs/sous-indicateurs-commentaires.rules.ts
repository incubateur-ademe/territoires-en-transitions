import {
  IndicateurPeriodes,
  type IndicateurPeriodicite,
} from '@tet/domain/indicateurs';
import type { IndicateurValeurField } from '../valeurs/grid/types';

export type PeriodeCommentaires = Readonly<
  Record<IndicateurValeurField, string>
>;

export type CommentedValeur = Readonly<{
  dateValeur: string;
  periodicite: IndicateurPeriodicite;
  resultatCommentaire?: string | null;
  objectifCommentaire?: string | null;
}>;

export const NO_COMMENTAIRES: PeriodeCommentaires = {
  resultat: '',
  objectif: '',
};

export const toCommentairesByPeriodeKey = (
  valeurs: readonly CommentedValeur[]
): ReadonlyMap<string, PeriodeCommentaires> =>
  new Map(
    valeurs.map(
      ({
        dateValeur,
        periodicite,
        resultatCommentaire,
        objectifCommentaire,
      }) => [
        IndicateurPeriodes.key(
          IndicateurPeriodes.containing(periodicite, dateValeur)
        ),
        {
          resultat: resultatCommentaire ?? '',
          objectif: objectifCommentaire ?? '',
        },
      ]
    )
  );

export const countCommentaires = ({
  resultat,
  objectif,
}: PeriodeCommentaires): number =>
  [resultat, objectif].filter((commentaire) => commentaire !== '').length;
