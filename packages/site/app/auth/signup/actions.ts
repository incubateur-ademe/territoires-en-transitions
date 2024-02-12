'use server';

import type {SignupData} from '@tet/ui';
import {revalidatePath} from 'next/cache';
import {cookies, headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {createClient} from 'src/supabase/actions';

/** Fonction de création de compte */
export const signup = async (formData: SignupData) => {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {email, password, tel, prenom, nom} = formData;
  let ret = null;

  /** Auth. par magiclink */
  if (!password) {
    // génère l'url vers laquelle l'utilisateur sera redirigé à partir du lien d'auth.
    // TODO: changer ça !
    const domain = headers().get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const emailRedirectTo = `${protocol}://${domain}/auth/signup-succeed`;

    // envoi le mail contenant le lien d'auth.
    ret = await supabase.auth.signInWithOtp({
      email,
      options: {shouldCreateUser: true, emailRedirectTo},
    });
  } else {
    // envoi le mail contenant le lien d'auth.
    ret = await supabase.auth.signUp({
      email,
      password,
    });
  }

  // redirige vers la page d'erreur
  if (!ret || ret.error) {
    console.log('signup error:', ret.error);
    redirect('/auth/error');
  }

  // enregistre les DCP
  const {data} = ret;
  const user_id = data.user?.id;
  if (user_id) {
    await supabase.from('dcp').insert([
      {
        email,
        telephone: tel,
        prenom,
        nom,
        user_id,
      },
    ]);
  }

  // et l'acceptation des CGU
  await supabase.rpc('accepter_cgu');

  // redirige vers la page appropriée
  const redirectTo = '/auth/login/msg_lien_envoye';
  revalidatePath('/', 'layout');
  redirect(redirectTo);
};
