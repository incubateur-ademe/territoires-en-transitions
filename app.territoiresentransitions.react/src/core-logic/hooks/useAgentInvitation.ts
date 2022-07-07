import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from './params';
import {makeInvitationLandingPath} from 'app/paths';

export const useAgentInvitation = () => {
  const collectiviteId = useCollectiviteId();
  const {data, isLoading} = useQuery<LatestInvitationResponse | null>(
    ['agent_invitation', collectiviteId],
    () =>
      collectiviteId
        ? fetchAgentInvitation(collectiviteId)
        : Promise.resolve(null)
  );

  const invitationId = data?.id || null;
  const invitationUrl = invitationId
    ? makeInvitationLandingPath(invitationId)
    : null;

  return {invitationId, invitationUrl, isLoading};
};

export interface LatestInvitationResponse {
  message?: string;
  id?: string;
}

/**
 * Returns an existing invitation that allows users to obtain the agent role
 * for a given collectivité
 */
const fetchAgentInvitation = async (
  collectivite_id: number
): Promise<LatestInvitationResponse | null> => {
  const {data, error} = await supabaseClient.rpc('latest_invitation', {
    collectivite_id,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data as unknown as LatestInvitationResponse) || null;
};
