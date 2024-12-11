import { VerifyOTP } from '@/auth/components/VerifyOTP/VerifyOTP';
import { SignupPropsWithState } from './type';

/**
 * Affiche l'étape 2 du panneau de création de compte
 */
export const SignupStep2 = (props: SignupPropsWithState) => {
  const {
    defaultValues,
    isLoading,
    error,
    onCancel,
    onSubmit,
    onResend,
    formState: { email },
  } = props;

  return (
    <VerifyOTP
      type="signup"
      isLoading={isLoading}
      defaultValues={{
        email: defaultValues?.email || email,
        otp: defaultValues?.otp,
      }}
      error={error}
      onCancel={onCancel}
      onSubmit={onSubmit}
      onResend={onResend}
    />
  );
};
