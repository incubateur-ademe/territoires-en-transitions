import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {supabase} from 'src/clientAPI';
import {getRootDomain, setAuthTokens} from '@tet/api';
import {
  Credentials,
  LoginView,
  isValidLoginView,
  LoginData,
} from '@components/Login';
import {VerifyOTPData, ResendFunction} from '@components/VerifyOTP';
import {useGetPasswordStrength} from '@components/PasswordStrengthMeter/useGetPasswordStrength';

/**
 * Gère l'appel à la fonction de login et la redirection après un login réussi
 */
export const useLoginState = ({
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

  const [view, setView] = useState<LoginView>(
    isValidLoginView(defaultView) ? (defaultView as LoginView) : 'etape1',
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onCancel = () => router.back();

  const onSubmit = async (formData: LoginData) => {
    // réinitialise les erreurs
    setError(null);

    // connexion par lien
    if (view === 'etape1' && !(formData as Credentials).password) {
      const {email} = formData;
      if (!email) return;

      // demande l'envoi du lien OTP de connexion
      setIsLoading(true);
      const {error} = await supabase.auth.signInWithOtp({
        email,
        options: {shouldCreateUser: false, emailRedirectTo: redirectTo},
      });
      setIsLoading(false);

      if (error) {
        setError("L'envoi du lien de connexion a échoué");
        return;
      }

      // indique que le mail a été envoyé
      setView('msg_lien_envoye');
      return;
    }

    // connexion par mot de passe
    if (view === 'etape1' && (formData as Credentials).password) {
      const {email, password} = formData as Credentials;
      if (!email || !password) return;

      setIsLoading(true);
      const {data, error} = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setIsLoading(false);

      if (error) {
        setError("L'email ou le mot de passe ne correspondent pas");
        return;
      }
      const session = data.session;
      if (session) {
        // enregistre les coookies de session
        setAuthTokens(session, getRootDomain(document.location.hostname));
        // et redirige sur la page voulue une fois authentifié
        router.push(redirectTo);
      }

      return;
    }

    // vérification du jeton OTP pour la connexion par lien
    if (view === 'verify') {
      const email = defaultValues?.email || formData?.email;
      const otp = defaultValues?.otp || (formData as VerifyOTPData)?.otp;
      if (!otp || !email) {
        return;
      }

      // vérifie le compte
      setIsLoading(true);
      const {data, error} = await supabase.auth.verifyOtp({
        email,
        type: 'magiclink',
        token: otp,
      });
      setIsLoading(false);

      // sort si il y a une erreur
      if (error || !data.session) {
        setError('La vérification du compte a échouée');
        return;
      }

      // enregistre les tokens dans le domaine racine pour pouvoir les partager entre les sous-domaines
      setAuthTokens(data.session, getDomain());

      // redirige
      router.push(redirectTo);
    }

    // vérification du jeton OTP pour le changement de mot de passe
    if (view === 'recover') {
      const email = defaultValues?.email || formData?.email;
      const otp = defaultValues?.otp || (formData as VerifyOTPData)?.otp;
      if (!otp || !email) {
        return;
      }

      // vérifie le compte
      setIsLoading(true);
      const {data, error} = await supabase.auth.verifyOtp({
        email,
        type: 'recovery',
        token: otp,
      });
      setIsLoading(false);

      // sort si il y a une erreur
      if (error || !data.session) {
        setError('La vérification du compte a échouée');
        return;
      }

      // enregistre les tokens dans le domaine racine pour pouvoir les partager entre les sous-domaines
      setAuthTokens(data.session, getDomain());

      // redirige
      setView('reset_mdp');
    }

    // demande de réinitialisation
    if (view === 'mdp_oublie') {
      const {email} = formData;
      if (!email) return;

      // demande la réinit. du mot de passe
      setIsLoading(true);
      const {error} = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      setIsLoading(false);

      if (error) {
        setError("L'envoi du lien de réinitialisation a échoué");
        return;
      }

      // indique que le mail a été envoyé
      setView('msg_init_mdp');
      return;
    }

    // réinitialisation du mot de passe
    if (view === 'reset_mdp') {
      const {password} = formData as Credentials;
      setIsLoading(true);
      const {error} = await supabase.auth.updateUser({password});
      setIsLoading(false);

      if (error) {
        setError('La réinitialisation du mot de passe a échoué');
        return;
      }

      router.push(redirectTo);
    }
  };

  // rappelle la fonction nécessaire si l'utilisateur demande le renvoi d'un email
  const onResend: ResendFunction = async ({type, email}) => {
    if (type && email) {
      // réinitialise les erreurs
      setError(null);

      setIsLoading(true);
      let ret;
      if (type === 'login') {
        ret = await supabase.auth.signInWithOtp({
          email,
          options: {shouldCreateUser: false, emailRedirectTo: redirectTo},
        });
      } else if (type === 'reset_password') {
        ret = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo,
        });
      }
      setIsLoading(false);
      if (ret?.error) {
        console.error(ret?.error);
        setError("L'envoi du message a échoué");
      }
      return;
    }
  };

  return {
    onCancel,
    onSubmit,
    onResend,
    view,
    setView,
    error,
    setError,
    isLoading,
    setIsLoading,
    getPasswordStrength,
  };
};

// détermine le domaine racine depuis l'url courante car il est nécessaire
// pour le partage des tokens entre sous-domaines
const getDomain = () =>
  document.location.hostname.split('.').toSpliced(0, 1).join('.') ||
  'localhost';
