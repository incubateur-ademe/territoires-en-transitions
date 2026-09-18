import { Section, Text } from '@react-email/components';
import { CTAButton } from '@tet/backend/utils/notifications/components/cta.button';
import { EmailContainer } from '@tet/backend/utils/notifications/components/email-container';
import { Footer } from '@tet/backend/utils/notifications/components/footer';
import * as React from 'react';
import { NotifyAvisRecuProps } from './notify-avis-recu.props';

/**
 * L'avis rendu sur un dossier PCAET, annoncé à la collectivité qui l'a déposé.
 *
 * Le message ne dit rien du contenu de l'avis : la pièce est confidentielle et
 * se lit sur la plateforme, pas dans une boîte mail.
 */
export const NotifyAvisRecuEmail = (
  props: NotifyAvisRecuProps
): React.ReactNode => {
  const { demarcheTitre, serviceNom, auTitreDe, documentsUrl, sendToEmail } =
    props;

  return (
    <EmailContainer>
      <Text>Bonjour,</Text>

      <Text>
        {serviceNom} a rendu son avis
        {auTitreDe ? ` au titre de ${auTitreDe.toLowerCase()}` : ''} sur votre
        projet de PCAET <b>{demarcheTitre}</b>.
      </Text>

      <Text>
        L&apos;avis est consultable sur la plateforme, dans les documents de
        votre démarche.
      </Text>

      <Section className="my-8 text-center">
        <CTAButton href={documentsUrl}>Consulter l&apos;avis →</CTAButton>
      </Section>

      <Footer
        toEmail={sendToEmail}
        raison="Vous recevez ce message car vous pilotez cette démarche ou administrez la collectivité sur Territoiresentransitions.fr"
      />
    </EmailContainer>
  );
};

// exemple pour react-email-preview (en dev)
NotifyAvisRecuEmail.PreviewProps = {
  demarcheTitre: 'PCAET 2024-2030',
  serviceNom: 'DREAL Bretagne',
  auTitreDe: 'Préfet de région',
  documentsUrl: 'https://app.territoiresentransitions.fr',
  sendToEmail: 'pilote@collectivite.fr',
};

export default NotifyAvisRecuEmail;
