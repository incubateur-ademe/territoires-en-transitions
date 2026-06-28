'use client';

import { LoginModal } from '@/app/users/authentications/login-user/login-modal';
import { useLoginState } from '@/app/users/authentications/login-user/use-login-state';

/**
 * Affiche la page de réinitialisation du mot de passe
 *
 * Monte `LoginModal` avec la vue forcée à `mdp_oublie`, ce qui démarre
 * directement le flux : ForgottenPassword → msg_init_mdp → recover (OTP) → reset_mdp.
 */
export const RecoverPageClient = ({
  email = null,
  redirect_to = '/',
}: {
  email: string | null;
  redirect_to: string;
}) => {
  const defaultValues = {
    email,
    otp: null,
  };

  const state = useLoginState({
    redirectTo: redirect_to ?? '/',
    defaultView: 'mdp_oublie',
    defaultValues,
  });

  return <LoginModal defaultValues={defaultValues} {...state} />;
};
