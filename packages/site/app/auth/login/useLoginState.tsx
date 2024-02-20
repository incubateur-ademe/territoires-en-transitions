import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {setAuthTokens} from '@tet/api';
import {Credentials, LoginView, DOMAIN} from '@tet/ui';
import {createClient} from 'src/supabase/client';

const errorMessage = {
  par_mdp: "L'email et le mot de passe ne correspondent pas",
  par_lien: "L'envoi du lien de connexion a échoué",
  mdp_oublie: "L'envoi du lien de réinitialisation a échoué",
};

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

  // fonction d'envoi du formulaire (dépend de la vue courante)
  const submitFunction = {
    par_mdp: ({email, password}: Credentials) => {
      if (!email || !password) return;

      return supabase.auth.signInWithPassword({
        email,
        password,
      });
    },
    par_lien: ({email}: Credentials) => {
      if (!email) return;

      return supabase.auth.signInWithOtp({
        email,
        options: {shouldCreateUser: false, emailRedirectTo: redirectTo},
      });
    },
    mdp_oublie: ({email}: Credentials) => {
      if (!email) return;

      return supabase.auth.resetPasswordForEmail(email, {redirectTo});
    },
  };

  type SubmitableView = keyof typeof submitFunction;

  const onSubmit = async (credentials: Credentials) => {
    // réinitialise les erreurs
    setError(null);

    // fait l'appel approprié suivant la vue
    const submit = submitFunction[view as SubmitableView];
    if (submit) {
      setIsLoading(true);
      const ret = await submit(credentials);
      setIsLoading(false);

      // sort si il y a une erreur
      if (!ret || ret.error) {
        setError(
          errorMessage[view as keyof typeof errorMessage] ||
            'Une erreur est survenue',
        );
        return;
      }

      if (view === 'par_lien') {
        // indique que le mail a été envoyé
        setView('msg_lien_envoye');
      } else if (view === 'par_mdp' && 'session' in ret?.data) {
        const session = ret.data.session;
        if (session) {
          // ou enregistre les coookies de session
          setAuthTokens(session, DOMAIN);
          // et redirige sur la page voulue une fois authentifié
          router.push(redirectTo);
        }
      } else if (view === 'mdp_oublie') {
        setView('msg_init_mdp');
      }
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
