import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';

import {TActionDiscussion, TActionDiscussionStatut} from './types';

export type ActionDiscussionFeedArgs = {
  action_id: string;
  statut: TActionDiscussionStatut;
};

/**
 * Charge les discussions d'une action en fonction de leur statut
 */
export const useActionDiscussionFeed = (args: ActionDiscussionFeedArgs) => {
  const collectivite_id = useCollectiviteId();

  const {data} = useQuery(['action_discussion_feed', args.statut], () =>
    collectivite_id ? fetch(collectivite_id, args.action_id, args.statut) : []
  );

  return (data as TActionDiscussion[]) || [];
};

/**
 * fetch les données
 */
const fetch = async (
  collectivite_id: number,
  action_id: string,
  statut: TActionDiscussionStatut
) => {
  const {data, error} = await supabaseClient
    .from('action_discussion_feed')
    .select()
    .match({
      collectivite_id,
      action_id,
      status: statut,
    })
    .order('created_at', {ascending: false});

  if (error) throw error?.message;

  if (error || !data) {
    return [];
  }

  return data;
};
