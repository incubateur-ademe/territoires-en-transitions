import { Text } from '@react-email/components';
import { EmailContainer } from '@tet/backend/utils/notifications/components/email-container';
import { Footer } from '@tet/backend/utils/notifications/components/footer';
import * as React from 'react';
import { NotifySupportServicesSansCompteProps } from './notify-support-services-sans-compte.props';

/**
 * L'alerte adressée au support quand une transmission saisit des services dont
 * aucun agent n'a de compte : personne ne sera prévenu, et le dossier risque de
 * dormir jusqu'à l'échéance.
 *
 * Pas de CTA : le support n'a pas accès au dossier de la collectivité.
 */
export const NotifySupportServicesSansCompteEmail = (
  props: NotifySupportServicesSansCompteProps
): React.ReactNode => {
  const { collectiviteNom, demarcheTitre, services, sendToEmail } = props;

  return (
    <EmailContainer>
      <Text>Bonjour,</Text>

      <Text>
        {collectiviteNom} vient de transmettre son projet de PCAET pour avis.
        Les services suivants ont été saisis, mais aucun de leurs agents
        n&apos;a de compte actif sur la plateforme : ils ne recevront aucune
        notification et ne peuvent pas accéder au dossier.
      </Text>

      {services.map((service) => (
        <Text key={service.nom}>
          — {service.nom} :{' '}
          {service.saisiPourAvis
            ? 'saisi pour avis'
            : 'destinataire pour information'}
        </Text>
      ))}

      <Text>
        Il conviendrait de les relancer ou de leur adresser une nouvelle
        invitation.
      </Text>

      <Text>Démarche concernée : {demarcheTitre}.</Text>

      <Footer
        toEmail={sendToEmail}
        raison="Message automatique adressé au support de Territoires en Transitions."
      />
    </EmailContainer>
  );
};

// exemple pour react-email-preview (en dev)
NotifySupportServicesSansCompteEmail.PreviewProps = {
  collectiviteNom: 'Redon Agglomération',
  demarcheTitre: 'PCAET 2024-2030',
  services: [
    { nom: 'DREAL Bretagne', saisiPourAvis: true },
    { nom: 'DDT du Morbihan', saisiPourAvis: false },
  ],
  sendToEmail: 'contact@territoiresentransitions.fr',
};

export default NotifySupportServicesSansCompteEmail;
