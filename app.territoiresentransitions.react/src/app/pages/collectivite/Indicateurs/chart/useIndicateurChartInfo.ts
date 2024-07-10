import {useQuery} from 'react-query';
import {DISABLE_AUTO_REFETCH, supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {Indicateurs} from '@tet/api';

/**
 * Charge les données nécessaires à l'affichage d'un graphique indicateur.
 *
 * Détermine notamment l'id à utiliser pour lire les valeurs à afficher dans le graphe
 * ou le décompte à afficher à la place du graphe.
 */
export const useIndicateurChartInfo = (indicateurId: number) => {
  const collectiviteId = useCollectiviteId();

  return useQuery(
    ['indicateur_chart_info', collectiviteId, indicateurId],
    async () =>
      collectiviteId
        ? Indicateurs.fetch.selectIndicateurChartInfo(
            supabaseClient,
            indicateurId,
            collectiviteId
          )
        : null,
    DISABLE_AUTO_REFETCH
  );
};
