import { useQuery } from 'react-query';

import { supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { filtreValuesFetch } from '@tet/api/collectivites/shared/data-access/filtre-values.fetch';
import { FiltreRessourceLiees } from '@tet/api/collectivites/shared/domain/filtre-ressource-liees.schema';

type Args = {
  filtre: FiltreRessourceLiees;
};

/** Charge les valeurs des filtres sélectionnés */
export const useFiltreValues = ({ filtre }: Args) => {
  const collectiviteId = useCollectiviteId();

  return useQuery(
    ['tableau_de_bord_module_filtre_values', filtre],
    async () => {
      if (!collectiviteId) {
        throw new Error('Aucune collectivité associée');
      }

      const { data } = await filtreValuesFetch({
        dbClient: supabaseClient,
        collectiviteId,
        filtre,
      });

      return data;
    }
  );
};
