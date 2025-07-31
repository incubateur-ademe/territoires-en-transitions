import { MailSendMessage } from '@/auth/components/Login/MailSendMessage';
import { useFormState } from '@/auth/components/Login/useFormState';
import { ResendMessage } from '../ResendMessage';
import { SignupStep1 } from './SignupStep1';
import { SignupStep2 } from './SignupStep2';
import { SignupStep3 } from './SignupStep3';
import { SignupProps } from './type';

/**
 * Affiche le panneau création de compte
 */
export const Signup = (props: SignupProps) => {
  const { view, onResend, isLoading } = props;
  const formState = useFormState(props);

  if (view === 'etape1') {
    return <SignupStep1 {...props} formState={formState} />;
  }

  if (view === 'etape2') {
    return <SignupStep2 {...props} formState={formState} />;
  }

  if (view === 'etape3') {
    return <SignupStep3 {...props} formState={formState} />;
  }

  if (view === 'msg_lien_envoye') {
    return (
      <>
        <MailSendMessage
          data-test="lien-envoye"
          message1="Pour activer votre compte, veuillez consulter votre boite mail et"
          message2="suivre le lien reçu !"
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
};
