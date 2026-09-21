import { Section, Text } from '@react-email/components';
import { CTAButton } from '@tet/backend/utils/notifications/components/cta.button';
import { EmailContainer } from '@tet/backend/utils/notifications/components/email-container';
import { Footer } from '@tet/backend/utils/notifications/components/footer';
import * as React from 'react';
import { NotifyDossierTransmisProps } from './notify-dossier-transmis.props';

/**
 * La transmission d'un dossier PCAET, annoncée à un service instructeur.
 *
 * Une seule variante de corps : ce qui change entre un service saisi pour avis
 * et un simple destinataire, c'est ce qu'on attend de lui, pas le reste du
 * message.
 */
export const NotifyDossierTransmisEmail = (
  props: NotifyDossierTransmisProps
): React.ReactNode => {
  const {
    collectiviteNom,
    serviceNom,
    saisiPourAvis,
    motifLecture,
    echeanceAvis,
    dossierUrl,
    sendToEmail,
  } = props;

  return (
    <EmailContainer>
      <Text>Bonjour,</Text>

      <Text>{collectiviteNom} a transmis son projet de PCAET pour avis.</Text>

      {saisiPourAvis ? (
        <Text>
          <b>{serviceNom} est saisi pour avis sur ce dossier.</b>
          {echeanceAvis
            ? ` Les avis sont attendus avant le ${echeanceAvis}.`
            : ''}
        </Text>
      ) : (
        <Text>
          <b>{serviceNom} est destinataire de ce dossier.</b>{' '}
          {motifLecture === 'territoire'
            ? "Ce dossier vous est communiqué pour information : il relève d'un territoire limitrophe, et l'avis revient au service dont il dépend."
            : "Ce dossier vous est communiqué pour information : votre service n'a pas d'avis à rendre sur un PCAET."}
        </Text>
      )}

      <Text>
        Le dossier, les documents déposés, le diagnostic et le programme
        d&apos;actions sont consultables sur la plateforme.
      </Text>

      <Section className="my-8 text-center">
        <CTAButton href={dossierUrl}>Consulter le dossier →</CTAButton>
      </Section>

      <Footer
        toEmail={sendToEmail}
        raison={`Vous recevez ce message car vous êtes membre de ${serviceNom} sur Territoiresentransitions.fr`}
      />
    </EmailContainer>
  );
};

// exemple pour react-email-preview (en dev)
NotifyDossierTransmisEmail.PreviewProps = {
  collectiviteNom: 'Redon Agglomération',
  serviceNom: 'DREAL Bretagne',
  saisiPourAvis: true,
  motifLecture: null,
  echeanceAvis: '15/12/2026',
  dossierUrl: 'https://app.territoiresentransitions.fr',
  sendToEmail: 'agent@developpement-durable.gouv.fr',
};

export default NotifyDossierTransmisEmail;
