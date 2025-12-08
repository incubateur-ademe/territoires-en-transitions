import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Event, Input, useEventTracker } from '@tet/ui';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ResendFunction, VerifyType } from '../VerifyOTP';

type ResendMessageProps = {
  /** Texte du bouton */
  buttonText?: string;
  /** Adresse par défaut à laquelle renvoyer le message */
  email: string;
  /** Indique un chargement un cours */
  isLoading: boolean | undefined;
  /** Indique que le champ de saisie de l'email et le bouton "envoyer" sont visible */
  isOpened?: boolean;
  /** Appelée pour renvoyer le message */
  onResend: ResendFunction;
  /** Type de vérification */
  type: VerifyType;
  /** Indique que l'email doit être demandé à l'utilisateur */
  askForEmail?: boolean;
};

/**
 * Invite à ré-essayer d'envoyer un message pour la connexion, la validation
 * d'email d'un nouveau compte ou la réninitialisation d'un mot de passe.
 */
export const ResendMessage = (props: ResendMessageProps) => {
  const {
    buttonText,
    email,
    isLoading,
    isOpened = false,
    onResend,
    type,
    askForEmail = true,
  } = props;
  const validationSchema = z.object({
    email: z.email({
      error: 'Un email valide est requis',
    }),
  });

  const { register, watch, formState } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: { email },
  });
  const emailValue = watch('email');

  const [opened, setOpened] = useState(isOpened);

  const eventTracker = useEventTracker();

  const handleResend = (opened: boolean) => {
    if (askForEmail) {
      setOpened(opened);
    } else {
      resend();
    }
  };

  const resend = () => {
    onResend({ type, email: emailValue });
    setOpened(false);
    eventTracker(Event.auth.submitResendMessage);
  };

  return (
    <div>
      <Button variant="underlined" onClick={() => handleResend(!opened)}>
        {buttonText || "Vous n'avez pas reçu de message ?"}
      </Button>

      {opened && (
        <div className="my-4 flex flex-col">
          <p>
            Vérifiez le dossier <i>spam</i> de votre messagerie ou essayez à
            {" nouveau d'envoyer le message à l'adresse :"}
          </p>
          <Input
            containerClassname="self-center w-max"
            className="font-bold"
            type="text"
            {...register('email')}
            icon={{
              buttonProps: {
                icon: 'send-plane-fill',
                title: 'Envoyer',
                disabled: isLoading || !formState.isValid,
                onClick: () => {
                  resend();
                },
              },
            }}
          />
        </div>
      )}
    </div>
  );
};
