import MailSend from './mail-send';

/** Affiche un message suite à l'envoi du mail de connexion ou de
 * réinitialisation du mot de passe */
export const MailSendMessage = ({
  message1,
  message2,
  message3,
  dataTest,
}: {
  message1: string;
  message2: string;
  message3?: string;
  dataTest?: string;
}) => {
  return (
    <div className="flex flex-col items-center" data-test={dataTest}>
      <MailSend />
      <p className="font-bold text-primary-9 text-center">
        {message1}{' '}
        <span className="font-extrabold text-primary-6">{message2}</span>
        {message3 && <span> {message3}</span>}
      </p>
    </div>
  );
};
