import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { ReferentielId } from '@/domain/referentiels';
import { useQuery } from 'react-query';

const fetchIndicateurSummary = async (
  collectivite_id: number,
  referentiel: ReferentielId
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
export const useIndicateurSummary = (referentiel: ReferentielId) => {
  const collectiviteId = useCollectiviteId();

  return useQuery(['indicateur_summary', collectiviteId, referentiel], () => {
    if (!collectiviteId) return;
    return fetchIndicateurSummary(collectiviteId, referentiel);
  });
};
