import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {
  Credentials,
  SignupData,
  SignupDataStep1,
  SignupDataStep2,
  SignupDataStep3,
  SignupView,
  isValidSignupView,
} from '@tet/ui';
import {createClient} from 'src/supabase/client';
import {getRootDomain, setAuthTokens} from '@tet/api';
import {useGetPasswordStrength} from 'app/auth/useGetPasswordStrength';

/**
 * Gère l'appel à la fonction de signup et la redirection
 */
export const useSignupState = ({
  redirectTo,
  defaultView,
  defaultValues,
}: {
  redirectTo: string;
  defaultView: string | null;
  defaultValues: {
    email: string | null;
    otp: string | null;
  };
}) => {
  const router = useRouter();

  const getPasswordStrength = useGetPasswordStrength();

  const [view, setView] = useState<SignupView>(
    isValidSignupView(defaultView) ? (defaultView as SignupView) : 'etape1',
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  const onCancel = () => router.back();

  const onSubmit = async (formData: SignupData) => {
    // réinitialise les erreurs
    setError(null);

    // ETAPE 1
    if (view === 'etape1') {
      const {email, password} = formData as SignupDataStep1;
      if (!email || isLoading) return;

      // fait l'appel approprié suivant qu'un mdp est spécifié ou non
      setIsLoading(true);
      const {error} = await (password
        ? supabase.auth.signUp({
            email,
            password,
            options: {emailRedirectTo: redirectTo},
          })
        : supabase.auth.signInWithOtp({
            email,
            options: {shouldCreateUser: true, emailRedirectTo: redirectTo},
          }));
      setIsLoading(false);

      // sort si il y a une erreur
      if (error) {
        console.error(error.status, error.name, error.message);
        setError(
          error.message === 'User already registered'
            ? 'Utilisateur déjà enregistré'
            : `Le compte n'a pas pu être créé (${error.status})`,
        );
        return;
      }

      // demande la saisie du code reçu par mail
      setView(password ? 'etape2' : 'msg_lien_envoye');
    }

    // ETAPE 2
    if (view === 'etape2') {
      const email = defaultValues?.email || formData?.email;
      const otp = defaultValues?.otp || (formData as SignupDataStep2)?.otp;
      if (!otp || !email) {
        return;
      }

      // vérifie le compte
      setIsLoading(true);
      const {data, error} = await supabase.auth.verifyOtp({
        email,
        type: 'signup',
        token: otp,
      });
      setIsLoading(false);

      // sort si il y a une erreur
      if (error || !data.session) {
        setError('La vérification du compte a échouée');
        return;
      }

      // le partage des tokens entre sous-domaines nécessite le nom du domaine racine.
      const domain = getRootDomain(document.location.hostname);

      // enregistre les tokens dans le domaine racine pour pouvoir les partager entre les sous-domaines
      setAuthTokens(data.session, domain);

      // demande la saisie des DCP et l'acceptation des CGU
      setView('etape3');
    }

    // ETAPE 3
    if (view === 'etape3') {
      // enregistre les DCP
      const {data} = await supabase.auth.getSession();
      const user_id = data.session?.user?.id;
      if (user_id) {
        const email = defaultValues?.email || formData?.email;
        const {tel: telephone, prenom, nom} = formData as SignupDataStep3;

        if (!email) return;

        const {error} = await supabase.from('dcp').insert([
          {
            email,
            telephone,
            prenom,
            nom,
            user_id,
          },
        ]);
        // et l'acceptation des CGU
        const {error: error2} = await supabase.rpc('accepter_cgu');

        if (error || error2) {
          setError('Une erreur est survenue. Veuillez contacter le support.');
          return;
        }

        // et redirige
        document.location.replace(redirectTo);
      } else {
        setError('Une erreur est survenue. Veuillez contacter le support.');
        return;
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
    getPasswordStrength,
  };
};
