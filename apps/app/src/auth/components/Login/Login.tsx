import { ResendMessage } from '../ResendMessage';
import { VerifyOTP } from '../VerifyOTP';
import { ForgottenPassword } from './ForgottenPassword';
import { LoginTabs } from './LoginTabs';
import { MailSendMessage } from './MailSendMessage';
import { ResetPassword } from './ResetPassword';
import { LoginProps } from './type';
import { useFormState } from './useFormState';

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
          data-test="msg_lien_envoye"
          message1="Pour vous connecter, veuillez consulter votre boite mail et"
          message2="cliquer sur le lien sécurisé reçu !"
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
          data-test="msg_init_mdp"
          message1="Veuillez consulter votre boite mail pour"
          message2="réinitialiser votre mot de passe."
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
