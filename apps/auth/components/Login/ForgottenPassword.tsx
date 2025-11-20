import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Event,
  Field,
  FieldMessage,
  Input,
  ModalFooter,
  ModalFooterSection,
  useEventTracker,
} from '@tet/ui';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { LoginPropsWithState } from './type';

/** Gestionnaire d'état pour le formulaire */
const useForgottenPassword = (email: string) => {
  const validationSchema = z.object({
    email: z.email({
      error: 'Un email valide est requis',
    }),
  });

  return useForm({
    reValidateMode: 'onChange',
    resolver: zodResolver(validationSchema),
    defaultValues: {
      email: email || '',
    },
  });
};

/** Demande de réinitialisation du mot de passe */
export const ForgottenPassword = (props: LoginPropsWithState) => {
  const {
    formState,
    error,
    isLoading,
    setView,
    onSubmit,
    onCancel,
    onOpenChatbox,
  } = props;
  const { email, setEmail } = formState;
  const form = useForgottenPassword(email);
  const {
    handleSubmit,
    register,
    formState: { isValid, errors },
  } = form;

  const eventTracker = useEventTracker();

  const onSubmitForm = (data: { email: string }) => {
    // enregistre les données car on a besoin de l'email pour vérifier l'otp à
    // l'étape suivante, dans le cas où l'utilisateur saisi directement le code
    // OTP plutôt que de cliquer sur le lien
    setEmail(data.email);
    // envoi les données
    onSubmit(data);
    eventTracker(Event.auth.submitForgottenPassword);
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit(onSubmitForm)}
      data-test="PasswordRecovery"
    >
      <Field
        title="Email de connexion *"
        htmlFor="email"
        state={errors.email ? 'error' : 'info'}
        message={
          errors.email?.message?.toString() ||
          "Vous devez être en mesure d'accéder à cette boîte mail pour ouvrir l'e-mail sinon contacter le support."
        }
      >
        <Input
          id="email"
          type="text"
          autoComplete="on"
          {...register('email')}
        />
      </Field>

      {onOpenChatbox && (
        <Button type="button" variant="underlined" onClick={onOpenChatbox}>
          Contactez le support !
        </Button>
      )}
      {!!error && (
        <FieldMessage messageClassName="mt-4" state="error" message={error} />
      )}
      <ModalFooter variant="space">
        <Button
          variant="outlined"
          icon="arrow-left-line"
          iconPosition="left"
          onClick={() => setView('etape1')}
        >
          Se connecter
        </Button>
        <ModalFooterSection>
          <Button type="button" variant="outlined" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={!isValid || isLoading}>
            Valider
          </Button>
        </ModalFooterSection>
      </ModalFooter>
    </form>
  );
};
