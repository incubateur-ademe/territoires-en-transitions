import {supabaseClient} from 'core-logic/api/supabase';

export interface UpdatePasswordParams {
  password: string;
}

/**
 * Met à jour le mot de passe utilisateur courant
 */
export const updatePassword = async ({password}: UpdatePasswordParams) => {
  const {error} = await supabaseClient.auth.update({password});

  if (error) throw error?.message;
  return true;
};
