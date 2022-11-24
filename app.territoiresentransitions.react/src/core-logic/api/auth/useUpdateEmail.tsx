import {supabaseClient} from 'core-logic/api/supabase';
import {useMutation} from 'react-query';

export interface UpdateEmailParams {
  email: string;
}

/**
 * Met à jour l'email de l'utilisateur courant
 */
export const useUpdateEmail = () => {
  const {mutate} = useMutation(updateEmail, {
    mutationKey: 'update_email',
  });

  const handleUpdateEmail = (email: UpdateEmailParams) => {
    mutate(email);
  };

  return {handleUpdateEmail};
};

/**
 * Query pour mettre à jour l'email de l'utilisateur courant
 */
export const updateEmail = async ({email}: UpdateEmailParams) => {
  const {error} = await supabaseClient.auth.updateUser({email});
  if (error) throw error?.message;
};
