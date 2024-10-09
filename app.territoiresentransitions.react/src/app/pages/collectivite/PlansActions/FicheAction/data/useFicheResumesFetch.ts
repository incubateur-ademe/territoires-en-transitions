import { useQuery } from 'react-query';

import {
  FetchOptions,
  ficheResumesFetch,
} from '@tet/api/plan-actions/fiche-resumes.list';
import { supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';

type Props = {
  options?: FetchOptions;
};

export const useFicheResumesFetch = (props?: Props) => {
  const { options } = props || {};
  const collectiviteId = useCollectiviteId();

  return useQuery(
    ['fiches_resume_collectivite', collectiviteId, options],
    async () => {
      if (!collectiviteId) {
        throw new Error('Aucune collectivité associée');
      }

      return await ficheResumesFetch({
        dbClient: supabaseClient,
        collectiviteId,
        options: options ?? { filtre: {} },
      });
    }
  );
};
