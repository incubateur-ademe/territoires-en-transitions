import { Referentiel } from '@/api/referentiel/domain/enum.schema';
import { supabaseClient } from '@/app/core-logic/api/supabase';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { useQuery } from 'react-query';

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
