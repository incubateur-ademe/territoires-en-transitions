import {Indicateurs} from '@tet/api';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useQuery} from 'react-query';

/** Réucpère tous les id des indicateurs favoris de la collectivité */
export const useIndicateursFavorisCollectiviteIds = () => {
  const collectivite_id = useCollectiviteId();

  return useQuery(
    ['indicateurs_favoris_collectivite', collectivite_id],
    async () =>
      Indicateurs.fetch.selectIndicateursFavorisCollectiviteIds(
        supabaseClient,
        collectivite_id!
      )
  );
};
