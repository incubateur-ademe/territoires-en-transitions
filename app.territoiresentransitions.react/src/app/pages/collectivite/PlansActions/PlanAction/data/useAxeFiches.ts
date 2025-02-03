import { FicheResume, ficheResumesFetch } from '@/api/plan-actions';
import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { useQuery } from 'react-query';
import { objectToCamel } from 'ts-case-convert';
import { fetchActionImpactId } from '../../FicheAction/data/useFicheActionImpactId';
import { sortFichesResume } from '../../FicheAction/data/utils';

type Args = {
  ficheIds: number[];
  axeId: number;
};

export const useAxeFiches = ({ ficheIds, axeId }: Args) => {
  const collectiviteId = useCollectiviteId()!;

  return useQuery(['axe_fiches', axeId, ficheIds], async () => {
    const { data } = await ficheResumesFetch({
      dbClient: supabaseClient,
      collectiviteId,
      options: { filtre: { ficheActionIds: ficheIds } },
    });

    const actionsImpact = await fetchActionImpactId(ficheIds);

    return sortFichesResume(objectToCamel(data ?? []) as FicheResume[]).map(
      (fiche) => {
        const actionImpact = actionsImpact?.find((f) => f.ficheId === fiche.id);
        return { ...fiche, actionImpactId: actionImpact?.actionImpactId };
      }
    );
  });
};
