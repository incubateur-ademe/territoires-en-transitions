import {
  invitationIdParam,
  invitationLandingPath,
  invitationMailParam,
} from '@/app/app/paths';
import { supabaseClient } from '@/app/core-logic/api/supabase';
import { usePathname } from 'next/navigation';
import { useMutation, useQueryClient } from 'react-query';

// extrait l'id d'invitation de l'url si il est présent
export const useInvitationState = () => {
  const pathname = usePathname();

  const match = pathname.match(
    new RegExp(
      `^${invitationLandingPath
        .replace(`:${invitationIdParam}`, '(.*)')
        .replace(`:${invitationMailParam}`, '(.*)')}$`
    )
  );

  const invitationId = match?.[1] || null;
  const invitationEmail = match?.[2] || null;

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
