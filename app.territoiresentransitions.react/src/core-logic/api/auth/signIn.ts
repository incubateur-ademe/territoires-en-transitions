import {supabase} from 'core-logic/api/supabase';

export interface SignInCredentials {
  email: string;
  mot_de_passe: string;
}

export const signIn = async (credentials: SignInCredentials) => {
  const {user, session, error} = await supabase.auth.signIn({
    email: credentials.email,
    password: credentials.mot_de_passe,
  });

  if (error) throw error;
};
