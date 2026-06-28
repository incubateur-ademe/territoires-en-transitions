import { appLabels } from '@/app/labels/catalog';
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
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { MailSendMessage } from '../login-user/mail-send-message';
import { LoginView } from '../login-user/type';
import { WarningStep2Message } from '../login-user/warning-step2-message';
import { ResendMessage } from '../resend-email';
import { SignupView } from '../signup-user';

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
  login: appLabels.authVerifyOtpPourSeConnecter,
  signup: appLabels.authVerifyOtpPourActiverCompte,
  reset_password: appLabels.authVerifyOtpPourChangerMdp,
};

const validationSchema = z.object({
  otp: z.string().refine((value) => Boolean(validateOTP(value))),
});

/** Gestionnaire d'état pour le formulaire de vérification du jeton OTP */
const useVerifyOTP = (otp: string) => {
  return useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodResolver(validationSchema),
    defaultValues: {
      // Valeur brute (6 chiffres) — InputOTP gère l'affichage formaté.
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
    setValue,
    watch,
  } = useVerifyOTP(defaultValues?.otp || '');

  const eventTracker = useEventTracker();
  const otpValue = watch('otp');
  const prefilledOtp = defaultValues?.otp || '';

  // InputOTP peut réécrire la valeur au montage : on réapplique l'OTP prérempli.
  useEffect(() => {
    if (prefilledOtp && validateOTP(prefilledOtp)) {
      setValue('otp', prefilledOtp, { shouldValidate: true });
    }
  }, [prefilledOtp, setValue]);

  const canSubmit = Boolean(validateOTP(otpValue || prefilledOtp));

  const onSubmitForm = handleSubmit((data: { otp: string }) => {
    const otp = validateOTP(data.otp || prefilledOtp);
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
          dataTest="auth.verify-otp.lien-envoye"
          message1={`${messageByType[type]}, ${appLabels.authVerifyOtpConsulterBoiteMail}`}
          message2={defaultValues?.email ?? ''}
          message3={appLabels.authVerifyOtpEntrerCodeRecu}
        />
        <Controller
          name="otp"
          control={control}
          render={({ field }) => (
            <Input
              type="otp"
              data-test="auth.verify-otp.otp-input"
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
            buttonText={appLabels.authVerifyOtpRenvoyerCode}
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
            dataTest="auth.verify-otp.retour-button"
            variant="outlined"
            icon="arrow-left-line"
            iconPosition="left"
            onClick={() => {
              setError?.(null);
              setSuccessMessage?.(null);
              setView?.('etape1');
            }}
          >
            {appLabels.retour}
          </Button>
          <ModalFooterSection>
            <Button
              dataTest="auth.verify-otp.annuler-button"
              variant="outlined"
              onClick={onCancel}
            >
              {appLabels.annuler}
            </Button>
            <Button
              dataTest="auth.verify-otp.valider-button"
              icon="arrow-right-line"
              iconPosition="right"
              disabled={!canSubmit || isLoading}
              type="submit"
            >
              {appLabels.valider}
            </Button>
          </ModalFooterSection>
        </ModalFooter>
      </form>
    </>
  );
};
