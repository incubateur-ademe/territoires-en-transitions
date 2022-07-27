import {supabaseClient} from 'core-logic/api/supabase';

export interface AgentInvitationResponse {
  message: string;
  id?: string;
}

/**
 * Creates a new invitation that allows users to obtain the agent role
 * for a given collectivité
 */
export const createAgentInvitation = async (
  collectiviteId: number
): Promise<AgentInvitationResponse> => {
  const {data, error} = await supabaseClient.rpc('create_agent_invitation', {
    collectivite_id: collectiviteId,
  });

  if (error) {
    console.error(error);
    return {message: error.message};
  }

  return data as unknown as AgentInvitationResponse;
};

export interface LatestInvitationResponse {
  message?: string;
  id?: string;
}

/**
 * Returns an existing invitation that allows users to obtain the agent role
 * for a given collectivité
 */
export const fetchAgentInvitation = async (
  collectiviteId: number
): Promise<LatestInvitationResponse> => {
  const {data, error} = await supabaseClient.rpc<LatestInvitationResponse>(
    'latest_invitation',
    {
      collectivite_id: collectiviteId,
    }
  );

  if (error) {
    console.error(error);
    return {message: error.message};
  }

  return data as unknown as LatestInvitationResponse;
};

/**
 * Accepts an invitation using its id as the authenticated user.
 * If the procedure succeed with a code 200, the user is an agent.
 * Returns true if successful.
 */
export const acceptAgentInvitation = async (
  invitationId: string
): Promise<boolean> => {
  const {error} = await supabaseClient.rpc('accept_invitation', {
    invitation_id: invitationId,
  });

  return error === null;
};

export interface AgentRemovalResponse {
  message?: string;
  error?: string;
}
