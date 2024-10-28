import {useRouteMatch} from 'react-router-dom';
import {supabaseClient} from 'core-logic/api/supabase';
import {
  invitationIdParam,
  invitationLandingPath,
  invitationMailParam,
} from 'app/paths';
import { useMutation, useQueryClient } from 'react-query';

// extrait l'id d'invitation de l'url si il est présent
export const useInvitationState = () => {
  const match = useRouteMatch<{
    [invitationIdParam]: string;
    [invitationMailParam]: string;
  }>(invitationLandingPath);
  const invitationId = match?.params?.[invitationIdParam] || null;
  const invitationEmail = match?.params?.[invitationMailParam] || null;
  if (!invitationId) return { invitationId };

  const params = new URLSearchParams(document.location.search);
  return { invitationId, invitationEmail, consume: params.get('consume') };
};

const acceptAgentInvitation = async (
  invitation_id: string
): Promise<boolean> => {
  const { error } = await supabaseClient.rpc('consume_invitation', {
    id: invitation_id,
  });
  return error === null;
};

// consomme une invitation à rejoindre une collectivité
export const useConsumeInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation('consume_invitation', acceptAgentInvitation, {
    // recharge les données associées à l'utilisateur pour que la redirection
    // vers le TdB de la collectivité qu'il vient de rejoindre fonctionne
    onSuccess: () => queryClient.invalidateQueries('user_data'),
  });
};
