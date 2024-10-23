import { useQuery } from 'react-query';
import { supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { Referentiel } from '@tet/api/referentiel/domain/enum.schema';

const fetchIndicateurSummary = async (
  collectivite_id: number,
  referentiel: Referentiel
) => {
  const { error, data } = await supabaseClient
    .from('indicateur_summary')
    .select('*')
    .match({ collectivite_id, categorie: referentiel });

  if (error) throw new Error(error.message);

  return data;
};

/**
 * Récupère le summary des indicateurs d'un référentiel pour une collectivité donnée
 */
export const useIndicateurSummary = (referentiel: Referentiel) => {
  const collectiviteId = useCollectiviteId();

  return useQuery(['indicateur_summary', collectiviteId, referentiel], () => {
    if (!collectiviteId) return;
    return fetchIndicateurSummary(collectiviteId, referentiel);
  });
};
