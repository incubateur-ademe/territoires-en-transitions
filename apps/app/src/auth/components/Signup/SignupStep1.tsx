import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Event,
  Field,
  Input,
  ModalFooterOKCancel,
  Tab,
  Tabs,
  useEventTracker,
} from '@tet/ui';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { PasswordStrengthMeter } from '../../components/PasswordStrengthMeter';
import { SignupDataStep1, SignupPropsWithState } from './type';

/** Gestionnaire d'état pour le formulaire de l'étape 1 */
const useSignupStep1 = (
  isPasswordless: boolean,
  email: string,
  isScoreStrongEnough: (password: string, otherValues: string[]) => boolean
) => {
  const validationSchema = z.object({
    email: z.email({
      error: 'Un email valide est requis',
    }),
    password: z
      .string()
      .refine((value) => (isPasswordless ? true : value.length >= 8), {
        error: 'Le mot de passe doit comporter au moins 8 caractères',
      })
      .refine(
        (value) =>
          isPasswordless ? true : isScoreStrongEnough(value, [email]),
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
      password: '',
      email: email || '',
    },
  });
};

/**
 * Affiche l'étape 1 du panneau de création de compte
 * (saisir un email et éventuellement un mot de passe)
 */
export const SignupStep1 = (props: SignupPropsWithState) => {
  const { formState, isScoreStrongEnough } = props;
  const { email } = formState;
  const [isPasswordless, setIsPasswordless] = useState(false);
  const form = useSignupStep1(isPasswordless, email, isScoreStrongEnough);
  const ongletTracker = useEventTracker();

  return (
    <>
      <Tabs
        className="justify-center"
        defaultActiveTab={isPasswordless ? 1 : 0}
        onChange={(activeTab: number) => {
          if (activeTab === 0) {
            // reset le champ mdp qui peut être rempli quand on passe d'un onglet à l'autre
            setIsPasswordless(false);
            ongletTracker(Event.auth.viewAvecMdp);
          } else {
            form.setValue('password', '');
            setIsPasswordless(true);
            ongletTracker(Event.auth.viewSansMdp);
          }
        }}
      >
        <Tab label="Compte avec mot de passe">
          <SignupStep1Form {...props} form={form} />
        </Tab>
        <Tab label="Compte sans mot de passe">
          <SignupStep1Form {...props} form={form} isPasswordless />
        </Tab>
      </Tabs>
    </>
  );
};

/**
 * Affiche le formulaire pour l'étape 1 de la création de compte
 */
const SignupStep1Form = (
  props: SignupPropsWithState & {
    form: ReturnType<typeof useSignupStep1>;
    isPasswordless?: boolean;
  }
) => {
  const {
    error,
    setError,
    isLoading,
    isPasswordless,
    onSubmit,
    onCancel,
    getPasswordStrength,
    form,
    formState: { setEmail },
  } = props;
  const {
    handleSubmit,
    register,
    watch,
    formState: { isValid, errors },
  } = form;
  const eventTracker = useEventTracker();

  const onSubmitForm = (data: SignupDataStep1) => {
    // enregistre les données car on a besoin de l'email pour vérifier l'otp à
    // l'étape suivante, dans le cas où l'utilisateur saisi directement le code
    // OTP plutôt que de cliquer sur le lien
    setEmail(data.email);
    // envoi les données
    onSubmit(data);
    eventTracker(Event.auth.submitSignup);
  };

  const email = watch('email');
  const password = watch('password');

  useEffect(() => {
    setError(null);
  }, [email, setError]);

  const res = isPasswordless ? null : getPasswordStrength(password, [email]);

  const isEmailAlreadyExists =
    error === "L'email est déjà associé à un compte existant.";

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmitForm)}>
      <Field
        title="Email professionnel *"
        htmlFor="email"
        state={
          errors.email ? 'error' : isEmailAlreadyExists ? 'warning' : undefined
        }
        message={
          errors.email?.message?.toString() ||
          (isEmailAlreadyExists ? error : undefined)
        }
      >
        <Input id="email" type="text" {...register('email')} />
      </Field>
      {isEmailAlreadyExists && (
        <Button href="/login" prefetch={false} size="xs" variant="underlined">
          Se connecter
        </Button>
      )}
      {!isPasswordless && (
        <Field
          title="Mot de passe *"
          htmlFor="password"
          state={errors.password ? 'error' : undefined}
        >
          <Input id="password" type="password" {...register('password')} />
          {!!res && (
            <PasswordStrengthMeter
              strength={res}
              errorMessage={errors.password?.message?.toString()}
            />
          )}
        </Field>
      )}

      <ModalFooterOKCancel
        btnCancelProps={{ onClick: onCancel }}
        btnOKProps={{
          type: 'submit',
          disabled: !isValid || isLoading,
        }}
      />
    </form>
  );
};
