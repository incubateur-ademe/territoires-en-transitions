import { Text } from '@react-email/components';
import { EmailContainer } from '@tet/backend/utils/notifications/components/email-container';
import { Footer } from '@tet/backend/utils/notifications/components/footer';
import * as React from 'react';
import { NotifyFichierInfecteProps } from './notify-fichier-infecte.props';

export const NotifyFichierInfecteEmail = (
  props: NotifyFichierInfecteProps
): React.ReactNode => {
  const { collectiviteNom, filenames, sendToEmail } = props;

  return (
    <EmailContainer>
      <Text>Bonjour,</Text>

      <Text>
        L&apos;antivirus de Territoires en Transitions a détecté une menace dans
        un fichier déposé sur l&apos;espace de <b>{collectiviteNom}</b> :
      </Text>

      {filenames.map((filename) => (
        <Text key={filename} className="my-0 ml-4">
          • <b>{filename}</b>
        </Text>
      ))}

      <Text>
        Ce fichier a été supprimé pour protéger les personnes qui le
        téléchargent. Les preuves, annexes et documents qui y faisaient
        référence sont conservés, et indiquent que le fichier a été supprimé.
      </Text>

      <Text>
        Nous vous conseillons de vérifier le poste depuis lequel il a été
        déposé, puis d&apos;en déposer une version saine. Si vous pensez
        qu&apos;il s&apos;agit d&apos;une erreur, écrivez-nous à
        contact@territoiresentransitions.fr.
      </Text>

      <Footer
        toEmail={sendToEmail}
        raison="Vous recevez ce message car vous administrez la collectivité sur Territoiresentransitions.fr"
      />
    </EmailContainer>
  );
};

// exemple pour react-email-preview (en dev)
NotifyFichierInfecteEmail.PreviewProps = {
  collectiviteNom: 'Agglo de démonstration',
  filenames: ['delib-2025.pdf'],
  sendToEmail: 'admin@collectivite.fr',
};

export default NotifyFichierInfecteEmail;
