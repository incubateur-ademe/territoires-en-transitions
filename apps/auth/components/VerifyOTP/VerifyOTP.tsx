import { zodResolver } from '@hookform/resolvers/zod';
import {
  Event,
  FieldMessage,
  Input,
  ModalFooterOKCancel,
  useEventTracker,
  validateOTP,
} from '@tet/ui';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { MailSendMessage } from '../../components/Login/MailSendMessage';
import { ResendMessage } from '../../components/ResendMessage';

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
  /** Indique qu'un appel réseau est en cours */
  isLoading?: boolean;
  /** Fonction appelée à l'envoi du formulaire */
  onSubmit?: (formData: VerifyOTPData) => void;
  /** Fonction appelée à l'annulation du formulaire */
  onCancel: () => void;
  /** Fonction appelée pour renvoyer l'email contenant le code */
  onResend: ResendFunction;
};

const messageByType: Record<VerifyType, string> = {
  login: 'Pour vous connecter',
  signup: 'Pour activer votre compte',
  reset_password: 'Pour changer de mot de passe',
};

/** Gestionnaire d'état pour le formulaire de vérification du jeton OTP */
const useVerifyOTP = (email: string, otp: string) => {
  const validationSchema = z.object({
    otp: z.string().refine(validateOTP),
  });

  return useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      email: email || '',
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
    onCancel,
    onSubmit,
    onResend,
  } = props;
  const {
    handleSubmit,
    register,
    formState: { isValid },
  } = useVerifyOTP(defaultValues?.email || '', defaultValues?.otp || '');

  const eventTracker = useEventTracker();

  const onSubmitForm = handleSubmit((data: VerifyOTPData) => {
    const otp = validateOTP(data.otp);
    if (otp && defaultValues.email) {
      onSubmit?.({ email: defaultValues.email, otp });
      eventTracker(Event.auth.submitVerifyOTP);
    }
  });

  return (
    <>
      <form className="flex flex-col gap-4" onSubmit={onSubmitForm}>
        <MailSendMessage
          data-test="lien-envoye"
          message1={`${messageByType[type]}, veuillez consulter votre boite mail et`}
          message2="entrer le code reçu !"
        />
        <Input
          type="otp"
          defaultValue={defaultValues?.otp}
          {...register('otp')}
          containerClassname="self-center w-fit"
        />
        {!!error && (
          <FieldMessage messageClassName="mt-4" state="error" message={error} />
        )}
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: onCancel }}
          btnOKProps={{
            type: 'submit',
            disabled: !isValid || isLoading,
          }}
          content={
            defaultValues?.otp ? undefined : (
              <ResendMessage
                email={defaultValues?.email || ''}
                isLoading={isLoading}
                onResend={onResend}
                type={type}
              />
            )
          }
        />
      </form>
    </>
  );
};
