import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Divider,
  Event,
  FieldMessage,
  Input,
  ModalFooter,
  ModalFooterSection,
  useEventTracker,
  validateOTP,
} from '@tet/ui';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { MailSendMessage } from '../Login/MailSendMessage';
import { LoginView } from '../Login/type';
import { WarningStep2Message } from '../Login/WarningStep2Message';
import { ResendMessage } from '../ResendMessage';
import { SignupView } from '../Signup';

export type VerifyOTPData = {
  email: string;
  otp: string;
};

export type VerifyType = 'signup' | 'login' | 'reset_password';

export type ResendFunction = (args: {
  type: VerifyType;
  email: string;
}) => void;

type VerifyOTPProps = {
  /** Type d'usage (fait varier le message affiché) */
  type: VerifyType;
  /** Valeurs par défaut pour initialiser les formulaires */
  defaultValues: { email: string | null; otp?: string | null };
  /** Erreur à afficher */
  error: string | null;
  /** Message de succès à afficher */
  successMessage?: string | null;
  /** Indique qu'un appel réseau est en cours */
  isLoading?: boolean;
  /** Fonction appelée à l'envoi du formulaire */
  onSubmit?: (formData: VerifyOTPData) => void;
  /** Fonction appelée à l'annulation du formulaire */
  onCancel: () => void;
  /** Fonction appelée pour renvoyer l'email contenant le code */
  onResend: ResendFunction;
  /** Fonction appelée pour changer de vue */
  setView?: ((view: SignupView) => void) | ((view: LoginView) => void);
  /** Fonction appelée pour réinitialiser les messages d'erreur et de succès */
  setError?: (error: string | null) => void;
  setSuccessMessage?: (successMessage: string | null) => void;
};

const messageByType: Record<VerifyType, string> = {
  login: 'Pour vous connecter',
  signup: 'Pour activer votre compte',
  reset_password: 'Pour changer de mot de passe',
};

/** Gestionnaire d'état pour le formulaire de vérification du jeton OTP */
const useVerifyOTP = (otp: string) => {
  const validationSchema = z.object({
    otp: z.string().refine(validateOTP),
  });

  return useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      otp: otp || '',
    },
  });
};

/**
 * Affiche le panneau de vérification du jeton OTP
 */
export const VerifyOTP = (props: VerifyOTPProps) => {
  const {
    type,
    defaultValues,
    isLoading,
    error,
    setError,
    setSuccessMessage,
    successMessage,
    onCancel,
    onSubmit,
    onResend,
    setView,
  } = props;
  const {
    handleSubmit,
    control,
    reset,
    formState: { isValid },
  } = useVerifyOTP(defaultValues?.otp || '');

  const eventTracker = useEventTracker();

  const onSubmitForm = handleSubmit((data: { otp: string }) => {
    const otp = validateOTP(data.otp);
    if (otp && defaultValues.email) {
      onSubmit?.({ email: defaultValues.email, otp });
      eventTracker(Event.auth.submitVerifyOTP);
    }
  });

  return (
    <>
      <form
        className="flex flex-col gap-4  justify-center"
        onSubmit={onSubmitForm}
      >
        <MailSendMessage
          data-test="lien-envoye"
          message1={`${messageByType[type]}, veuillez consulter votre boite mail`}
          message2={defaultValues?.email ?? ''}
          message3="et entrer le code reçu !"
        />
        <Controller
          name="otp"
          control={control}
          render={({ field }) => (
            <Input
              type="otp"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              containerClassname="self-center w-fit"
            />
          )}
        />

        {(successMessage || error) && (
          <FieldMessage
            messageClassName="mx-auto "
            state={successMessage ? 'success' : 'error'}
            message={successMessage ? successMessage : error || ''}
          />
        )}

        <div className="mx-auto">
          <ResendMessage
            buttonText="Renvoyer le code"
            email={defaultValues?.email || ''}
            isLoading={isLoading}
            onResend={({
              type,
              email,
            }: {
              type: VerifyType;
              email: string;
            }) => {
              reset();
              onResend({ type, email });
            }}
            type={type}
            askForEmail={false}
          />
        </div>

        <WarningStep2Message />
        <Divider className="mt-4 pb-[1px]"></Divider>
        <ModalFooter variant="space">
          <Button
            variant="outlined"
            icon="arrow-left-line"
            iconPosition="left"
            onClick={() => {
              setError?.(null);
              setSuccessMessage?.(null);
              setView?.('etape1');
            }}
          >
            Retour
          </Button>
          <ModalFooterSection>
            <Button variant="outlined" onClick={onCancel}>
              Annuler
            </Button>
            <Button
              icon="arrow-right-line"
              iconPosition="right"
              disabled={!isValid || isLoading}
              type="submit"
            >
              Valider
            </Button>
          </ModalFooterSection>
        </ModalFooter>
      </form>
    </>
  );
};
