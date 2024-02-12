'use server';

import type {Credentials, LoginView} from '@tet/ui';
import {revalidatePath} from 'next/cache';
import {cookies, headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {createClient} from 'src/supabase/actions';

/** Fonction d'authentification */
export const login = async (view: LoginView, credentials: Credentials) => {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {email, password} = credentials;
  let ret = null;

  /** Auth. par magiclink */
  if (view === 'par_lien') {
    // génère l'url vers laquelle l'utilisateur sera redirigé à partir du lien d'auth.
    const domain = headers().get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const emailRedirectTo = `${protocol}://${domain}/auth/login-succeed`;

    // envoi le mail contenant le lien d'auth.
    ret = await supabase.auth.signInWithOtp({
      email: credentials.email,
      options: {shouldCreateUser: false, emailRedirectTo},
    });
  } else if (view === 'par_mdp' && password) {
    /** Auth. par mot de passe */
    ret = await supabase.auth.signInWithPassword({email, password});
  }

  // redirige vers la page d'erreur
  if (!ret || ret.error) {
    redirect('/error');
  }

  // redirige vers la page appropriée si l'appel a réussi
  const redirectTo = view === 'par_lien' ? '/auth/login/msg_lien_envoye' : '/';
  revalidatePath('/', 'layout');
  redirect(redirectTo);
};
