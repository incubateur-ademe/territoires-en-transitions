import {useQuery} from 'react-query';

import {ficheResumesFetch} from '@tet/api/dist/src/fiche_actions/fiche_resumes.list/data_access/fiche_resumes.fetch';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {FetchOptions} from '@tet/api/dist/src/fiche_actions/fiche_resumes.list/domain/fetch_options.schema';

type Props = {
  options?: FetchOptions;
};

export const useFicheResumesFetch = ({options}: Props) => {
  const collectiviteId = useCollectiviteId();

  return useQuery(
    ['fiches_resume_collectivite', collectiviteId, options],
    async () => {
      if (!collectiviteId) {
        throw new Error('Aucune collectivité associée');
      }

      if (!options) {
        return null;
      }

      return await ficheResumesFetch({
        dbClient: supabaseClient,
        collectiviteId,
        options,
      });
    }
  );
};