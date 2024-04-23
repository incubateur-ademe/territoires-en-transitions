import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {
  Input,
  Field,
  FieldMessage,
  ModalFooterOKCancel,
  useEventTracker,
  TrackPageView,
} from '@tet/ui';
import {LoginData, LoginPropsWithState} from './type';
import {PasswordStrengthMeter} from '@components/PasswordStrengthMeter';

/** Gestionnaire d'état pour le formulaire */
const useResetPassword = (email: string) => {
  const validationSchema = z.object({
    password: z.string().refine(value => value.length >= 8, {
      message: 'Le mot de passe doit comporter au moins 8 caractères',
    }),
  });

  return useForm({
    reValidateMode: 'onChange',
    resolver: zodResolver(validationSchema),
    defaultValues: {
      email: email || '',
      password: '',
    },
  });
};

/** Réinitialisation du mot de passe après validation du jeton OTP */
export const ResetPassword = (props: LoginPropsWithState) => {
  const {
    error,
    isLoading,
    onCancel,
    onSubmit,
    getPasswordStrength,
    defaultValues,
  } = props;
  const {
    handleSubmit,
    register,
    watch,
    formState: {isValid},
  } = useResetPassword(defaultValues?.email || '');

  const password = watch('password');
  const res = getPasswordStrength(password, [defaultValues?.email || '']);

  const eventTracker = useEventTracker('auth/login/reset_mdp');
  const onSubmitForm = handleSubmit((data: LoginData) => {
    onSubmit?.(data);
    // @ts-expect-error
    eventTracker('cta_submit', {});
  });

  return (
    <>
      <TrackPageView pageName="auth/login/reset_mdp" />
      <form onSubmit={onSubmitForm} data-test="ResetPassword">
        <Field
          className="mb-6 md:col-span-2"
          title="Nouveau mot de passe"
          htmlFor="password"
        >
          <Input type="password" {...register('password')} id="password" />
          {!!res && <PasswordStrengthMeter strength={res} />}
        </Field>
        {!!error && (
          <FieldMessage messageClassName="mt-4" state="error" message={error} />
        )}
        <ModalFooterOKCancel
          btnOKProps={{
            type: 'submit',
            disabled: !isValid || isLoading || (res && res.score < 4),
          }}
          btnCancelProps={{onClick: onCancel}}
        />
      </form>
    </>
  );
};
