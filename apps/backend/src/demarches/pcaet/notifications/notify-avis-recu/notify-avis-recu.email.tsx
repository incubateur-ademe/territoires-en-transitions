import { Section, Text } from '@react-email/components';
import { CTAButton } from '@tet/backend/utils/notifications/components/cta.button';
import { EmailContainer } from '@tet/backend/utils/notifications/components/email-container';
import { Footer } from '@tet/backend/utils/notifications/components/footer';
import * as React from 'react';
import { NotifyAvisRecuProps } from './notify-avis-recu.props';

/**
 * L'avis rendu sur un dossier PCAET, annoncé à la collectivité qui l'a déposé,
 * aux EPCI que couvre le dépôt d'un Supra, et en copie aux services qui suivent
 * l'instruction.
 *
 * Le message ne dit rien du contenu de l'avis : la pièce est confidentielle et
 * se lit sur la plateforme, pas dans une boîte mail.
 */
export const NotifyAvisRecuEmail = (
  props: NotifyAvisRecuProps
): React.ReactNode => {
  const {
    demarcheTitre,
    serviceNom,
    auTitreDe,
    copie,
    couverture,
    url,
    sendToEmail,
  } = props;
  const titre = auTitreDe ? ` au titre de ${auTitreDe.toLowerCase()}` : '';

  return (
    <EmailContainer>
      <Text>Bonjour,</Text>

      {copie ? (
        <>
          <Text>
            {serviceNom} a rendu son avis{titre} sur le projet de PCAET{' '}
            <b>{demarcheTitre}</b> de {copie.collectiviteNom}.
          </Text>

          <Text>
            L&apos;avis est consultable sur la plateforme, dans le dossier.
          </Text>
        </>
      ) : couverture ? (
        <>
          <Text>
            {serviceNom} a rendu son avis{titre} sur le projet de PCAET{' '}
            <b>{demarcheTitre}</b>, porté par {couverture.porteurNom} pour le
            territoire de {couverture.collectiviteCouverteNom}.
          </Text>

          <Text>
            L&apos;avis est consultable sur la plateforme, en lecture seule.
          </Text>
        </>
      ) : (
        <>
          <Text>
            {serviceNom} a rendu son avis{titre} sur votre projet de PCAET{' '}
            <b>{demarcheTitre}</b>.
          </Text>

          <Text>
            L&apos;avis est consultable sur la plateforme, dans les documents de
            votre démarche.
          </Text>
        </>
      )}

      <Section className="my-8 text-center">
        <CTAButton href={url}>
          {copie ? 'Consulter le dossier →' : "Consulter l'avis →"}
        </CTAButton>
      </Section>

      <Footer
        toEmail={sendToEmail}
        raison={
          copie
            ? `Vous recevez ce message car vous êtes membre de ${copie.destinataireServiceNom} sur Territoiresentransitions.fr`
            : couverture
            ? `Vous recevez ce message car vous administrez ${couverture.collectiviteCouverteNom}, dont le territoire est couvert par ce PCAET, sur Territoiresentransitions.fr`
            : 'Vous recevez ce message car vous pilotez cette démarche ou administrez la collectivité sur Territoiresentransitions.fr'
        }
      />
    </EmailContainer>
  );
};

// exemple pour react-email-preview (en dev)
NotifyAvisRecuEmail.PreviewProps = {
  demarcheTitre: 'PCAET 2024-2030',
  serviceNom: 'DREAL Bretagne',
  auTitreDe: 'Préfet de région',
  copie: null,
  couverture: null,
  url: 'https://app.territoiresentransitions.fr',
  sendToEmail: 'pilote@collectivite.fr',
};

export default NotifyAvisRecuEmail;
