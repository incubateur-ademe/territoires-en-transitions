import {useQuery} from 'react-query';

import {ficheActionResumesFetch} from '@tet/api/dist/src/fiche_actions/resumes.list/actions/fiche_action_resumes.fetch';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {FetchOptions} from '@tet/api/dist/src/fiche_actions/resumes.list/domain/fetch_options.schema';

type Props = {
  options: FetchOptions;
};

export const useFicheActionResumeFetch = ({options}: Props) => {
  const collectiviteId = useCollectiviteId();

  return useQuery(
    ['fiches_resume_collectivite', collectiviteId, options],
    async () => {
      if (!collectiviteId) {
        throw new Error('Aucune collectivité associée');
      }

      return await ficheActionResumesFetch({
        dbClient: supabaseClient,
        collectiviteId,
        options,
      });
    }
  );
};
