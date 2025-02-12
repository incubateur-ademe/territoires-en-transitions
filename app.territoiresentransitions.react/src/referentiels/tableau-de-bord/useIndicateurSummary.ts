import { DBClient } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { ReferentielId } from '@/domain/referentiels';
import { useQuery } from 'react-query';

const fetchIndicateurSummary = async (
  supabase: DBClient,
  collectivite_id: number,
  referentiel: ReferentielId
) => {
  const { error, data } = await supabase
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
  const supabase = useSupabase();

  return useQuery(['indicateur_summary', collectiviteId, referentiel], () => {
    if (!collectiviteId) return;
    return fetchIndicateurSummary(supabase, collectiviteId, referentiel);
  });
};
