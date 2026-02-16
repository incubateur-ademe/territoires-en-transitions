import { useMutation } from '@tanstack/react-query';
import { useSupabase, useTRPC } from '@tet/api';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useGetPasswordStrength } from '../../components/PasswordStrengthMeter/useGetPasswordStrength';
import {
  SignupData,
  SignupDataStep1,
  SignupDataStep2,
  SignupDataStep3,
  SignupView,
  isValidSignupView,
} from '../../components/Signup';
import { ResendFunction } from '../../components/VerifyOTP';

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
  const supabase = useSupabase();
  const trpc = useTRPC();

  const { mutateAsync: updateUser } = useMutation(
    trpc.users.users.update.mutationOptions()
  );

  const getPasswordStrength = useGetPasswordStrength();

  const [view, setView] = useState<SignupView>(
    isValidSignupView(defaultView) ? (defaultView as SignupView) : 'etape1'
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onCancel = () => router.back();

  const onSubmit = async (formData: SignupData) => {
    // réinitialise les erreurs
    setError(null);

    // ETAPE 1
    if (view === 'etape1') {
      const { email, password } = formData as SignupDataStep1;
      if (!email || isLoading) return;

      // fait l'appel approprié suivant qu'un mdp est spécifié ou non
      setIsLoading(true);
      const { error } = await (password
        ? supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: redirectTo },
          })
        : supabase.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: true, emailRedirectTo: redirectTo },
          }));
      setIsLoading(false);

      // sort si il y a une erreur
      if (error) {
        console.error(error.status, error.name, error.message);
        setError(
          error.message === 'User already registered'
            ? 'Utilisateur déjà enregistré'
            : `Le compte n'a pas pu être créé`
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
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        type: 'signup',
        token: otp,
      });
      setIsLoading(false);

      // sort si il y a une erreur
      if (error) {
        setError(
          'La création de compte a échoué. Veuillez refaire la manipulation "créer un compte". Attention le lien envoyé par email n\'est valide qu\'une heure. Si le problème persiste, contactez le support.' +
            '(' +
            error.name +
            error.code +
            error.message +
            ')'
        );
        return;
      }

      if (!data.session) {
        setError(
          'La création de compte a échoué. Veuillez refaire la manipulation "créer un compte".'
        );
        return;
      }

      // demande la saisie des DCP et l'acceptation des CGU
      setView('etape3');
    }

    // ETAPE 3
    if (view === 'etape3') {
      const { data } = await supabase.auth.getUser();
      if (!data.user?.id) {
        setError('Une erreur est survenue. Veuillez contacter le support.');
        return;
      }

      const { telephone, prenom, nom } = formData as SignupDataStep3;

      try {
        await updateUser({
          prenom,
          nom,
          telephone,
          hasAcceptedCGU: true,
        });
      } catch {
        setError('Une erreur est survenue. Veuillez contacter le support.');
        return;
      }

      router.replace(redirectTo);
    }
  };

  // rappelle la fonction nécessaire si l'utilisateur demande le renvoi d'un email
  const onResend: ResendFunction = async ({ type, email }) => {
    if (type && email) {
      // réinitialise les erreurs
      setError(null);

      setIsLoading(true);
      let ret;
      if (type === 'signup') {
        ret = await supabase.auth.resend({
          type,
          email,
          options: {
            emailRedirectTo: redirectTo,
          },
        });
      } else if (type === 'login') {
        ret = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: true, emailRedirectTo: redirectTo },
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
