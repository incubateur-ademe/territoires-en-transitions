import { IndicateurTrajectoire } from '@/app/indicateurs/trajectoires/trajectoire-constants';
import { DATE_DEBUT_SNBC_V3, DATE_FIN_SNBC_V3 } from '@tet/domain/indicateurs';
import { useIndicateurTrajectoireDatasets } from '../../use-indicateur-trajectoire-datasets';
import { useGetTrajectoireSnbc3 } from './use-get-trajectoire-snbc3';

/**
 * Charge la trajectoire SNBC 3 d'un indicateur et la compare aux objectifs et
 * résultats de la collectivité sur les années de la SNBC 3 (2020 à 2050).
 * `isErrorTrajectoire` signale l'échec du chargement de la trajectoire.
 */
export const useIndicateurTrajectoireSnbc3 = ({
  indicateur,
  secteurIdx,
}: {
  indicateur: IndicateurTrajectoire;
  secteurIdx: number;
}) => {
  const { data, isLoading, isError } = useGetTrajectoireSnbc3();

  const datasets = useIndicateurTrajectoireDatasets({
    indicateur,
    secteurIdx,
    trajectoireParCategorie: data?.trajectoire,
    isLoadingTrajectoire: isLoading,
    dateDebut: DATE_DEBUT_SNBC_V3,
    dateFin: DATE_FIN_SNBC_V3,
  });

  // la requête ne réessaie pas : sans cet état, un échec afficherait une page
  // vide ou « données non disponibles »
  return { ...datasets, isErrorTrajectoire: isError };
};
