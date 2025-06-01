import { Button, Event, Input, TrackPageView, useEventTracker } from '@/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ResendFunction, VerifyType } from '../VerifyOTP';

type ResendMessageProps = {
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
};

/**
 * Invite à ré-essayer d'envoyer un message pour la connexion, la validation
 * d'email d'un nouveau compte ou la réninitialisation d'un mot de passe.
 */
export const ResendMessage = (props: ResendMessageProps) => {
  const { email, isLoading, isOpened = false, onResend, type } = props;
  const validationSchema = z.object({
    email: z.string().email({ message: 'Un email valide est requis' }),
  });

  const { register, watch, formState } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: { email },
  });
  const emailValue = watch('email');

  const [opened, setOpened] = useState(isOpened);

  const pageName = `auth/resend_otp/${type}` as const;
  const eventTracker = useEventTracker();

  return (
    <div>
      <TrackPageView pageName={pageName} />
      <Button variant="underlined" onClick={() => setOpened(!opened)}>
        {"Vous n'avez pas reçu de message ?"}
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
                  onResend({ type, email: emailValue });
                  setOpened(false);
                  eventTracker(Event.auth.submitResendMessage);
                },
              },
            }}
          />
        </div>
      )}
    </div>
  );
};
