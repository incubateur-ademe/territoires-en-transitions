import { appLabels } from '@/app/labels/catalog';
import { MailSendMessage } from '../login-user/mail-send-message';
import { useFormState } from '../login-user/use-form-state';
import { ResendMessage } from '../resend-email';
import { VerifyOTP } from '../verify-otp/verify-otp';
import { SignupStep1 } from './signup-step1';
import { SignupStep3 } from './signup-step3';
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
    return (
      <VerifyOTP
        type="signup"
        {...props}
        defaultValues={{
          email: props?.defaultValues?.email || formState.email,
          otp: props?.defaultValues?.otp,
        }}
      />
    );
  }

  if (view === 'etape3') {
    return <SignupStep3 {...props} formState={formState} />;
  }

  if (view === 'msg_lien_envoye') {
    return (
      <>
        <MailSendMessage
          dataTest="auth.signup.lien-envoye"
          message1={appLabels.authSignupLienEnvoye1}
          message2={appLabels.authSignupLienEnvoye2}
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
