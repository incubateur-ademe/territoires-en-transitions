import { zodResolver } from '@hookform/resolvers/zod';
import {
  Event,
  Field,
  FieldMessage,
  Input,
  ModalFooterOKCancel,
  useEventTracker,
} from '@tet/ui';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { PasswordStrengthMeter } from '../../components/PasswordStrengthMeter';
import { LoginPropsWithState } from './type';

/** Gestionnaire d'état pour le formulaire */
const useResetPassword = (
  defaultValues: { email: string },
  isScoreStrongEnough: (password: string, otherValues: string[]) => boolean
) => {
  const validationSchema = z.object({
    email: z.string().optional(),
    password: z
      .string()
      .refine((value) => value.length >= 8, {
        error: 'Le mot de passe doit comporter au moins 8 caractères',
      })
      .refine(
        (value) => isScoreStrongEnough(value, [defaultValues?.email || '']),
        {
          error: "Votre mot de passe n'est pas suffisamment robuste",
        }
      ),
  });

  return useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodResolver(validationSchema),
    defaultValues: {
      email: defaultValues?.email || '',
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
    isScoreStrongEnough,
    defaultValues,
  } = props;
  const {
    handleSubmit,
    register,
    watch,
    formState: { isValid, errors },
  } = useResetPassword(
    { email: defaultValues?.email || '' },
    isScoreStrongEnough
  );

  const password = watch('password');
  const res = getPasswordStrength(password, [defaultValues?.email || '']);

  const eventTracker = useEventTracker();
  const onSubmitForm = handleSubmit((data) => {
    onSubmit?.({ email: data.email || '', password: data.password });
    eventTracker(Event.auth.submitResetPassword);
  });

  return (
    <form onSubmit={onSubmitForm} data-test="ResetPassword">
      <Field
        className="mb-6 md:col-span-2"
        title="Nouveau mot de passe"
        htmlFor="password"
      >
        <Input type="password" {...register('password')} id="password" />
        {!!res && (
          <PasswordStrengthMeter
            strength={res}
            errorMessage={errors?.password?.message?.toString() || ''}
          />
        )}
      </Field>
      {!!error && (
        <FieldMessage messageClassName="mt-4" state="error" message={error} />
      )}
      <ModalFooterOKCancel
        btnOKProps={{
          type: 'submit',
          disabled: !isValid || isLoading,
        }}
        btnCancelProps={{ onClick: onCancel }}
      />
    </form>
  );
};
