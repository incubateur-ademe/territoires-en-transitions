import {
  Button,
  Event,
  Field,
  FieldMessage,
  Input,
  ModalFooterOKCancel,
  Tab,
  Tabs,
  useEventTracker,
} from '@/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Credentials, LoginPropsWithState } from './type';

/** Gestionnaire d'état pour le formulaire de l'étape 1 */
const useLoginForm = (isPasswordless: boolean, email: string) => {
  const validationSchema = z.object({
    email: z
      .string()
      .email({
        message: 'Un email valide est requis',
      })
      .trim(),
    password: z
      .string()
      .refine((value) => (isPasswordless ? true : value.length >= 8), {
        message: 'Le mot de passe doit comporter au moins 8 caractères',
      }),
  });

  return useForm({
    reValidateMode: 'onChange',
    resolver: zodResolver(validationSchema),
    defaultValues: {
      password: '',
      email: email || '',
    },
  });
};

/**
 * Affiche l'étape 1 du panneau de connexion
 * (saisir un email et éventuellement un mot de passe)
 */
export const LoginTabs = (props: LoginPropsWithState) => {
  const { formState: signupState } = props;
  const { email } = signupState;
  const [isPasswordless, setIsPasswordless] = useState(false);
  const form = useLoginForm(isPasswordless, email);
  const ongletTracker = useEventTracker();

  return (
    <Tabs
      className="justify-center"
      defaultActiveTab={isPasswordless ? 1 : 0}
      onChange={(activeTab) => {
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
      <Tab label="Connexion avec mot de passe">
        <SignupStep1Form {...props} form={form} />
      </Tab>
      <Tab label="Connexion sans mot de passe">
        <SignupStep1Form {...props} form={form} isPasswordless />
      </Tab>
    </Tabs>
  );
};

/**
 * Affiche le formulaire pour l'étape 1 la connnexion
 */
const SignupStep1Form = (
  props: LoginPropsWithState & {
    form: ReturnType<typeof useLoginForm>;
    isPasswordless?: boolean;
  }
) => {
  const {
    error,
    isLoading,
    isPasswordless,
    setView,
    onSubmit,
    onCancel,
    form,
    formState: { setEmail },
  } = props;
  const {
    handleSubmit,
    register,
    formState: { isValid, errors },
  } = form;
  const eventTracker = useEventTracker();

  const onSubmitForm = (data: Credentials) => {
    // enregistre les données car on a besoin de l'email pour vérifier l'otp à
    // l'étape suivante, dans le cas où l'utilisateur saisi directement le code
    // OTP plutôt que de cliquer sur le lien contenu dans le mail
    setEmail(data.email);
    // envoi les données
    onSubmit(data);
    eventTracker(Event.auth.submitLogin);
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmitForm)}>
      <Field
        title="Email de connexion *"
        htmlFor="email"
        state={errors.email ? 'error' : isPasswordless ? 'info' : undefined}
        message={
          errors.email?.message?.toString() ||
          (isPasswordless &&
            'La connexion se fait par lien sécurisé envoyé sur votre boite mail.') ||
          ''
        }
      >
        <Input id="email" type="text" {...register('email')} />
      </Field>
      {!isPasswordless && (
        <>
          <Field
            title="Mot de passe *"
            htmlFor="password"
            state={errors.password ? 'error' : undefined}
            message={errors.password?.message?.toString()}
          >
            <Input id="password" type="password" {...register('password')} />
          </Field>
          <Button
            data-test="forgotten-pwd"
            type="button"
            variant="underlined"
            onClick={() => setView('mdp_oublie')}
          >
            Mot de passe oublié ?
          </Button>
        </>
      )}
      {!!error && (
        <FieldMessage
          data-test="error"
          messageClassName="mt-4"
          state="error"
          message={error}
        />
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
