import { appLabels } from '@/app/labels/catalog';
import { ResendMessage } from '../resend-email';
import { VerifyOTP } from '../verify-otp';
import { ForgottenPassword } from './forgotten-password';
import { LoginTabs } from './login-tabs';
import { MailSendMessage } from './mail-send-message';
import { ResetPassword } from './reset-password';
import { LoginProps } from './type';
import { useFormState } from './use-form-state';

/**
 * Affiche le panneau d'authentification et le formulaire "mot de passe oublié"
 */
export const Login = (props: LoginProps) => {
  const { view, onResend, isLoading } = props;
  const formState = useFormState(props);

  // affiche les onglets connexion sans/avec mot de passe
  if (view === 'etape1') {
    return <LoginTabs {...props} formState={formState} />;
  }

  if (view === 'mdp_oublie') {
    return <ForgottenPassword {...props} formState={formState} />;
  }

  if (view === 'recover') {
    return <VerifyOTP type="reset_password" {...props} />;
  }

  if (view === 'reset_mdp') {
    return <ResetPassword {...props} formState={formState} />;
  }

  if (view === 'verify') {
    return <VerifyOTP type="login" {...props} />;
  }

  if (view === 'msg_lien_envoye') {
    return (
      <>
        <MailSendMessage
          dataTest="auth.login.msg-lien-envoye"
          message1={appLabels.authMsgLienEnvoye1}
          message2={appLabels.authMsgLienEnvoye2}
        />
        <ResendMessage
          email={formState.email}
          isLoading={isLoading}
          onResend={onResend}
          type="login"
        />
      </>
    );
  }

  if (view === 'msg_init_mdp') {
    return (
      <>
        <MailSendMessage
          dataTest="auth.login.msg-init-mdp"
          message1={appLabels.authMsgInitMdp1}
          message2={appLabels.authMsgInitMdp2}
        />
        <ResendMessage
          email={formState.email}
          isLoading={isLoading}
          onResend={onResend}
          type="reset_password"
        />
      </>
    );
  }
};
