import {supabaseClient} from 'core-logic/api/supabase';
import {useQuery} from 'react-query';
import {FicheResume} from '../../FicheAction/data/types';
import {sortFichesResume} from '../../FicheAction/data/utils';
import {fetchActionImpactId} from '../../FicheAction/data/useFicheActionImpactId';

type Args = {
  ficheIds: number[];
  axeId: number;
};

export const useAxeFiches = ({ficheIds, axeId}: Args) => {
  return useQuery(['axe_fiches', axeId, ficheIds], async () => {
    const {data} = await supabaseClient
      .from('fiche_resume')
      .select()
      .in('id', ficheIds);

     const {data: actionsImpact} = await fetchActionImpactId(ficheIds);

     return sortFichesResume(data as FicheResume[]).map(fiche => {
       const actionImpact = actionsImpact?.find(f => f.fiche_id === fiche.id);
       return {...fiche, actionImpactId: actionImpact?.action_impact_id};
     });
  });
};
