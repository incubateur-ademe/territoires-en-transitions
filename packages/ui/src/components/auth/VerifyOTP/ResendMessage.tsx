import {Button} from '@design-system/Button';
import {ResendFunction, VerifyType} from './VerifyOTP';

/**
 * Afiche un message invitant à ré-essayer d'envoyer un message pour la connexion,
 * validation d'email d'un nouveau compte ou la réninitialisation d'un mot de passe.
 */
export const ResendMessage = ({
  email,
  isLoading,
  onResend,
  type,
}: {
  email: string;
  isLoading: boolean | undefined;
  onResend: ResendFunction;
  type: VerifyType;
}) => {
  return (
    <div className="self-center">
      <p>Vous n'avez pas reçu de message ?</p>
      <p>
        Vérifiez le dossier <i>spam</i> de votre messagerie ou cliquez sur le
        lien ci-dessous pour essayer d'envoyer à nouveau un message à l'adresse{' '}
        <b>{email}</b>
      </p>
      <Button
        data-test="resend-mail"
        type="button"
        variant="underlined"
        disabled={isLoading}
        onClick={() => onResend({type, email})}
      >
        Réessayer
      </Button>
    </div>
  );
};
