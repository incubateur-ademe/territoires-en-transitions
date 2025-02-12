import { useQuery } from 'react-query';

import {
  FetchOptions,
  ficheResumesFetch,
} from '@/api/plan-actions/fiche-resumes.list';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';

type Props = {
  options?: FetchOptions;
};

export const useFicheResumesFetch = (props?: Props) => {
  const { options } = props || {};
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

  return useQuery(
    ['fiches_resume_collectivite', collectiviteId, options],
    async () => {
      if (!collectiviteId) {
        throw new Error('Aucune collectivité associée');
      }

      return await ficheResumesFetch({
        dbClient: supabase,
        collectiviteId,
        options: options ?? { filtre: {} },
      });
    }
  );
};
