import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {setAuthTokens} from '@tet/api';
import {Credentials, LoginView, DOMAIN} from '@tet/ui';
import {createClient} from 'src/supabase/client';

/**
 * Gère l'appel à la fonction de login et la redirection après un login réussi
 */
export const useLoginState = (redirectTo: string) => {
  const router = useRouter();

  const [view, setView] = useState<LoginView>('par_lien');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  const onCancel = () => router.back();
  const onSubmit = async (credentials: Credentials) => {
    const {email, password} = credentials;

    // réinitialise les erreurs
    setError(null);

    // vérifie les paramètres
    const isValid = view === 'par_lien' || (view === 'par_mdp' && password);
    if (!isValid) {
      // on ne fait rien
      return;
    }

    // fait l'appel approprié
    setIsLoading(true);
    const ret =
      view === 'par_lien'
        ? /** Auth. par magiclink */
          await supabase.auth.signInWithOtp({
            email: credentials.email,
            options: {shouldCreateUser: false, emailRedirectTo: redirectTo},
          })
        : /** ou par mdp */
          await supabase.auth.signInWithPassword({
            email,
            password: password!,
          });

    // sort si il y a une erreur
    setIsLoading(false);
    if (!ret || ret.error) {
      setError(ret?.error.message || 'Une erreur est survenue');
    }

    const {session} = ret.data;
    if (view === 'par_lien') {
      // indique que le mail a été envoyé
      setView('msg_lien_envoye');
    } else if (session) {
      // ou enregistre les coookies de session
      setAuthTokens(session, DOMAIN);
      // et redirige sur la page voulue une fois authentifié
      router.push(redirectTo);
    }
  };

  return {
    onCancel,
    onSubmit,
    view,
    setView,
    error,
    setError,
    isLoading,
    setIsLoading,
  };
};
