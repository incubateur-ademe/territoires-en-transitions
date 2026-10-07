import { appLabels } from '@/app/labels/catalog';
import {
  Credentials,
  isValidLoginView,
  LoginData,
  LoginView,
} from '@/app/users/authentications/login-user/type';
import {
  isScoreStrongEnough,
  useGetPasswordStrength,
} from '@/app/users/authentications/password-strength-meter/use-get-password-strength';
import {
  ResendFunction,
  VerifyOTPData,
} from '@/app/users/authentications/verify-otp';
import { useSupabase } from '@tet/api';
import { Event, LoginMethod, useEventTracker } from '@tet/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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

  const supabase = useSupabase();

  const trackEvent = useEventTracker();

  const getPasswordStrength = useGetPasswordStrength();

  const [view, setView] = useState<LoginView>(
    isValidLoginView(defaultView) ? (defaultView as LoginView) : 'etape1'
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onCancel = () => router.back();

  const onSubmit = async (formData: LoginData) => {
    // réinitialise les erreurs
    setError(null);

    // connexion par lien
    if (view === 'etape1' && !(formData as Credentials).password) {
      const { email } = formData;
      if (!email) return;

      // demande l'envoi du lien OTP de connexion
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
      });
      setIsLoading(false);

      if (error) {
        console.error(error);
        trackEvent(Event.auth.login.error, {
          methode: 'lien_magique' satisfies LoginMethod,
          etape: 'envoi_lien',
          erreurType: error.code ?? error.name,
        });
        setError(appLabels.authErreurEnvoiLienConnexion);
        return;
      }

      trackEvent(Event.auth.login.magicLinkSent);

      // indique que le mail a été envoyé
      setView('msg_lien_envoye');
      return;
    }

    // connexion par mot de passe
    if (view === 'etape1' && (formData as Credentials).password) {
      const { email, password } = formData as Credentials;
      if (!email || !password) return;

      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setIsLoading(false);

      if (error) {
        console.error(error);
        trackEvent(Event.auth.login.error, {
          methode: 'mot_de_passe' satisfies LoginMethod,
          etape: 'identifiants',
          erreurType: error.code ?? error.name,
        });
        setError(appLabels.authErreurEmailOuMotDePasse);
        return;
      }
      const session = data.session;
      if (session) {
        trackEvent(Event.auth.login.success, {
          methode: 'mot_de_passe' satisfies LoginMethod,
        });
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

      // vérifie le compte (OTP numérique → type `email`, cf. docs Supabase passwordless)
      setIsLoading(true);
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        type: 'email',
        token: otp,
      });
      setIsLoading(false);

      // sort si il y a une erreur
      if (error) {
        console.error(error);
        trackEvent(Event.auth.login.error, {
          methode: 'lien_magique' satisfies LoginMethod,
          etape: 'verification_code',
          erreurType: error.code ?? error.name,
        });
        setError(appLabels.authErreurConnexionMagicLink);
        return;
      }

      if (!data.session) {
        trackEvent(Event.auth.login.error, {
          methode: 'lien_magique' satisfies LoginMethod,
          etape: 'verification_code',
          erreurType: 'session_absente',
        });
        setError(appLabels.authErreurConnexionSupport);
        return;
      }

      trackEvent(Event.auth.login.success, {
        methode: 'lien_magique' satisfies LoginMethod,
      });

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
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        type: 'recovery',
        token: otp,
      });
      setIsLoading(false);

      // sort si il y a une erreur
      if (error || !data.session) {
        if (error) {
          console.error(error);
        }
        setError(appLabels.authErreurChangementMotDePasse);
        return;
      }

      // redirige
      setView('reset_mdp');
    }

    // demande de réinitialisation
    if (view === 'mdp_oublie') {
      const { email } = formData;
      if (!email) return;

      // demande la réinit. du mot de passe
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      setIsLoading(false);

      if (error) {
        console.error(error);
        setError(appLabels.authErreurEnvoiLienReinit);
        return;
      }

      trackEvent(Event.auth.password.resetRequested);

      // indique que le mail a été envoyé
      setView('msg_init_mdp');
      return;
    }

    // réinitialisation du mot de passe
    if (view === 'reset_mdp') {
      const { password } = formData as Credentials;
      setIsLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      setIsLoading(false);

      if (error) {
        console.error(error);
        setError(appLabels.authErreurReinitMotDePasse);
        return;
      }

      trackEvent(Event.auth.password.resetSuccess);

      router.push(redirectTo);
    }
  };

  // rappelle la fonction nécessaire si l'utilisateur demande le renvoi d'un email
  const onResend: ResendFunction = async ({ type, email }) => {
    if (type && email) {
      // réinitialise les erreurs
      setError(null);

      setIsLoading(true);
      let ret;
      if (type === 'login') {
        ret = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
        });
      } else if (type === 'reset_password') {
        ret = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo,
        });
      }
      setIsLoading(false);
      if (ret?.error) {
        console.error(ret?.error);
        setError(appLabels.authErreurEnvoiMessage);
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
    isScoreStrongEnough,
  };
};
