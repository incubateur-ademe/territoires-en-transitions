import {supabaseClient} from 'core-logic/api/supabase';

export interface UpdatePasswordParams {
  token: string;
  password: string;
}

/** Met à jour le mot de passe utilisateur à partir du token extrait de l'url
 * reçue par mail lorsque l'utilisateur demande la réinitialisation */
export const updatePassword = async ({
  token,
  password,
}: UpdatePasswordParams) => {
  const {error} = await supabaseClient.auth.api.updateUser(token, {password});

  if (error) throw error?.message;
  return true;
};
