import {useMutation} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from './params';
import {makeInvitationLandingPath} from 'app/paths';

export interface AgentInvitationResponse {
  message: string;
  id?: string;
}

export const useGenerateInvitation = () => {
  const collectiviteId = useCollectiviteId();
  const {
    isLoading,
    mutate: generateInvitation,
    data,
  } = useMutation<AgentInvitationResponse | null>(() =>
    collectiviteId
      ? createAgentInvitation(collectiviteId)
      : Promise.resolve(null)
  );

  const invitationId = data?.id || null;
  const invitationUrl = invitationId
    ? makeInvitationLandingPath(invitationId)
    : null;

  return {
    isLoading,
    generateInvitation,
    invitationUrl,
  };
};

/**
 * Creates a new invitation that allows users to obtain the agent role
 * for a given collectivité
 */
export const createAgentInvitation = async (
  collectiviteId: number
): Promise<AgentInvitationResponse | null> => {
  const {data, error} = await supabaseClient.rpc('create_agent_invitation', {
    collectivite_id: collectiviteId,
  });

  if (error) {
    return {message: error.message};
  }

  return (data as unknown as AgentInvitationResponse) || null;
};
