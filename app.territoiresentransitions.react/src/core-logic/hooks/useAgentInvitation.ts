import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from './params';
import {makeInvitationLandingPath} from 'app/paths';
import {createAgentInvitation} from './useGenerateInvitation';

export const useAgentInvitation = () => {
  const collectivite_id = useCollectiviteId();

  const {data, isLoading} = useQuery<LatestInvitationResponse | null>(
    ['agent_invitation', collectivite_id],
    () =>
      collectivite_id
        ? fetchAgentInvitation(collectivite_id).then(
            createIfNotExists(collectivite_id)
          )
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

// renvoi une fonction qui elle-même renvoi l'invitation donnée si elle est
// valide ou à défaut la promesse de la réponse à la fonction de création d'une
// demande
const createIfNotExists =
  (collectivite_id: number) =>
  (
    invitation: LatestInvitationResponse | null
  ): Promise<LatestInvitationResponse | null> => {
    return invitation?.id
      ? Promise.resolve(invitation)
      : (createAgentInvitation(
          collectivite_id
        ) as Promise<LatestInvitationResponse | null>);
  };
