import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {FicheResume} from '../../../app/pages/collectivite/PlansActions/FicheAction/data/types';

export const useFichesResumeListe = () => {
  const collectivite_id = useCollectiviteId();

  return useQuery(['fiches_resume_collectivite', collectivite_id], async () => {
    const {error, data} = await supabaseClient
      .from('fiche_resume')
      .select()
      .match({collectivite_id})
      .order('titre', {ascending: true});

    if (error) throw new Error(error.message);

    return data as FicheResume[];
  });
};
