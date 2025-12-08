import { VerifyOTP } from '../../components/VerifyOTP/VerifyOTP';
import { SignupPropsWithState } from './type';

/**
 * Affiche l'étape 2 du panneau de création de compte
 */
export const SignupStep2 = (props: SignupPropsWithState) => {
  const {
    defaultValues,
    isLoading,
    error,
    successMessage,
    onCancel,
    onSubmit,
    onResend,
    setView,
    formState: { email },
    setError,
    setSuccessMessage,
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
      successMessage={successMessage}
      onCancel={onCancel}
      onSubmit={onSubmit}
      onResend={onResend}
      setView={setView}
      setError={setError}
      setSuccessMessage={setSuccessMessage}
    />
  );
};
