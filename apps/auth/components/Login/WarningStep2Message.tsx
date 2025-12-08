import { Icon } from '@tet/ui';
import { alertClassnames } from '@tet/ui/design-system/Alert/utils';
import { cn } from '@tet/ui/utils/cn';

export const WarningStep2Message = () => {
  const styles = alertClassnames['warning'];
  return (
    <div className={cn('rounded-lg p-4', styles.background)}>
      <div className={cn('flex gap-4 rounded-lg mb-2', styles.background)}>
        <Icon icon="information-fill" className={cn('mt-0.5', styles.text)} />
        <div className={cn('text-base font-bold flex flex-col', styles.text)}>
          Vous n’avez pas reçu l’email avec le code ?
        </div>
      </div>
      <div className="text-sm [&_*]:text-sm font-medium text-grey-9 [&_*]:text-grey-9 [&>*]:last:mb-0 flex flex-col gap-3 pl-10">
        <ul className="list-disc list-outside">
          <li>
            Pensez à vérifier votre dossier de courriers indésirables (spam).
          </li>
          <li>
            Assurez-vous que votre solution anti-spam n’a pas bloqué le message,
            car elle peut le retenir pendant plusieurs minutes. (Mailinblack,
            Altospam, Vade Secure, Bitdefender, Spamfighter, MailWasher)
          </li>
          <li>
            Rapprochez-vous de votre DSI afin d’obtenir l’assistance nécessaire.
          </li>
          <li>
            Si aucune de ces solutions ne vous a donné satisfaction, contactez
            notre support{' '}
            <a href="mailto:contact@territoiresentransitions.fr">
              contact@territoiresentransitions.fr
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};
