import {
  IndicateurPeriodes,
  type IndicateurPeriode,
} from '@tet/domain/indicateurs';
import { useCallback, useMemo } from 'react';
import { useIndicateurActions } from '../detail/context/indicateur-actions.context';
import { useIndicateurChart } from '../detail/context/indicateur-chart.context';
import { useIndicateurData } from '../detail/context/indicateur-data.context';
import {
  NO_COMMENTAIRES,
  type PeriodeCommentaires,
} from './indicateur-periode-commentaires.rules';

export type IndicateurPeriodeCommentaires = Readonly<{
  isReady: boolean;
  commentairesOf: (periode: IndicateurPeriode) => PeriodeCommentaires;
  save: (
    input: Readonly<{
      periode: IndicateurPeriode;
      commentaires: PeriodeCommentaires;
    }>
  ) => Promise<boolean>;
}>;

export const useIndicateurPeriodeCommentaires =
  (): IndicateurPeriodeCommentaires => {
    const { indicateur } = useIndicateurData();
    const { chartInfo } = useIndicateurChart();
    const { saveValeur } = useIndicateurActions();
    const { valeursExistantes } = chartInfo.data.valeurs.resultats;

    const findExisting = useCallback(
      (periode: IndicateurPeriode) =>
        valeursExistantes.find(
          (valeur) =>
            IndicateurPeriodes.key(valeur.periode) ===
            IndicateurPeriodes.key(periode)
        ),
      [valeursExistantes]
    );

    const commentairesOf = useCallback(
      (periode: IndicateurPeriode): PeriodeCommentaires => {
        const existing = findExisting(periode);
        return existing
          ? {
              resultat: existing.resultatCommentaire ?? '',
              objectif: existing.objectifCommentaire ?? '',
            }
          : NO_COMMENTAIRES;
      },
      [findExisting]
    );

    const save = useCallback(
      async ({
        periode,
        commentaires,
      }: Parameters<
        IndicateurPeriodeCommentaires['save']
      >[0]): Promise<boolean> => {
        if (periode.periodicite !== indicateur.periodicite) {
          return false;
        }
        try {
          await saveValeur({
            id: findExisting(periode)?.id,
            dateValeur: periode.dateDebut,
            periodicite: periode.periodicite,
            resultatCommentaire: commentaires.resultat,
            objectifCommentaire: commentaires.objectif,
          });
          return true;
        } catch {
          return false;
        }
      },
      [indicateur.periodicite, saveValeur, findExisting]
    );

    return useMemo(
      () => ({ isReady: !chartInfo.isLoading, commentairesOf, save }),
      [chartInfo.isLoading, commentairesOf, save]
    );
  };
