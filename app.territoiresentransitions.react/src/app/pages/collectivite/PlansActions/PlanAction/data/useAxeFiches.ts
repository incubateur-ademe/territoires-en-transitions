// import { ficheResumesFetch } from '@/api/plan-actions';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useFicheResumesFetch } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useFicheResumesFetch';
import { useQuery } from 'react-query';
import { objectToCamel } from 'ts-case-convert';
import { fetchActionImpactId } from '../../FicheAction/data/useFicheActionImpactId';
import { sortFichesResume } from '../../FicheAction/data/utils';

type Args = {
  ficheIds: number[];
  axeId: number;
};

export const useAxeFiches = ({ ficheIds, axeId }: Args) => {
  const supabase = useSupabase();

  const { data: ficheResumes } = useFicheResumesFetch({
    filters: {
      ficheIds: ficheIds,
    },
  });

  return useQuery(
    ['axe_fiches', axeId, ficheIds],
    async () => {
      const actionsImpact = await fetchActionImpactId(supabase, ficheIds);
      const fiches = ficheResumes?.data ?? [];

      return sortFichesResume(objectToCamel(fiches)).map((fiche) => {
        const actionImpact = actionsImpact?.find((f) => f.ficheId === fiche.id);
        return { ...fiche, actionImpactId: actionImpact?.actionImpactId };
      });
    },
    {
      enabled: !!ficheResumes?.data,
    }
  );
};
