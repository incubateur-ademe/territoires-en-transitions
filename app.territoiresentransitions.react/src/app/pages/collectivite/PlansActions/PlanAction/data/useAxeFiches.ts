import { FicheResume } from '@tet/api/plan-actions';
import { supabaseClient } from 'core-logic/api/supabase';
import { useQuery } from 'react-query';
import { objectToCamel } from 'ts-case-convert';
import { fetchActionImpactId } from '../../FicheAction/data/useFicheActionImpactId';
import { sortFichesResume } from '../../FicheAction/data/utils';

type Args = {
  ficheIds: number[];
  axeId: number;
};

export const useAxeFiches = ({ ficheIds, axeId }: Args) => {
  return useQuery(['axe_fiches', axeId, ficheIds], async () => {
    const { data } = await supabaseClient
      .from('fiche_resume')
      .select()
      .in('id', ficheIds);

    const actionsImpact = await fetchActionImpactId(ficheIds);

    return sortFichesResume(objectToCamel(data ?? []) as FicheResume[]).map(
      (fiche) => {
        const actionImpact = actionsImpact?.find((f) => f.ficheId === fiche.id);
        return { ...fiche, actionImpactId: actionImpact?.actionImpactId };
      }
    );
  });
};
