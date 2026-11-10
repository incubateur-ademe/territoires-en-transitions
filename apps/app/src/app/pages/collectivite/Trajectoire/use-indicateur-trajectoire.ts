import { DATE_FIN_SNBC_V2 } from '@tet/domain/indicateurs';
import { IndicateurTrajectoire } from '../../../../indicateurs/trajectoires/trajectoire-constants';
import { useIndicateurTrajectoireDatasets } from './use-indicateur-trajectoire-datasets';
import { useGetTrajectoire } from './use-trajectoire';

/**
 * Charge et transforme les données de la trajectoire SNBC 2 d'un indicateur
 * donné pour pouvoir tracer les graphiques.
 */
export const useIndicateurTrajectoire = ({
  indicateur,
  secteurIdx,
}: {
  /** indicateur trajectoire */
  indicateur: IndicateurTrajectoire;
  /** index du secteur sélectionné */
  secteurIdx: number;
}) => {
  const { data, isLoading } = useGetTrajectoire();

  return useIndicateurTrajectoireDatasets({
    indicateur,
    secteurIdx,
    trajectoireParCategorie: data?.trajectoire,
    isLoadingTrajectoire: isLoading,
    dateFin: DATE_FIN_SNBC_V2,
  });
};
