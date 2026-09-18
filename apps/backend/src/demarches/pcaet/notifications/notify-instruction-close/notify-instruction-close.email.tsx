import { Section, Text } from '@react-email/components';
import { CTAButton } from '@tet/backend/utils/notifications/components/cta.button';
import { EmailContainer } from '@tet/backend/utils/notifications/components/email-container';
import { Footer } from '@tet/backend/utils/notifications/components/footer';
import { DemarchePcaetTransitionEnum } from '@tet/domain/demarches';
import * as React from 'react';
import { NotifyInstructionCloseProps } from './notify-instruction-close.props';

/**
 * La clôture de l'instruction, annoncée à la collectivité.
 *
 * Le message dit pourquoi : « tous les avis rendus » laisse des avis à traiter
 * dans le mémoire de réponse, « délai échu » veut dire que des services n'ont
 * pas répondu et qu'on avance sans eux. Sans la raison, le destinataire ne sait
 * pas ce qui l'attend.
 */
export const NotifyInstructionCloseEmail = (
  props: NotifyInstructionCloseProps
): React.ReactNode => {
  const { demarcheTitre, motif, documentsUrl, sendToEmail } = props;

  return (
    <EmailContainer>
      <Text>Bonjour,</Text>

      <Text>
        L&apos;instruction de votre projet de PCAET <b>{demarcheTitre}</b> est
        close :{' '}
        {motif === DemarchePcaetTransitionEnum.AVIS_TOUS_RENDUS
          ? 'tous les avis attendus ont été rendus.'
          : 'le délai imparti aux services consultés est échu.'}
      </Text>

      {/* Sans détailler les avis : sur un délai échu, il peut n'y en avoir
          aucun à consulter. */}
      <Text>
        Il vous revient maintenant de finaliser la démarche : déposez le mémoire
        de réponse et la délibération d&apos;adoption, puis publiez votre
        démarche.
      </Text>

      <Section className="my-8 text-center">
        <CTAButton href={documentsUrl}>Finaliser la démarche →</CTAButton>
      </Section>

      <Footer
        toEmail={sendToEmail}
        raison="Vous recevez ce message car vous pilotez cette démarche ou administrez la collectivité sur Territoiresentransitions.fr"
      />
    </EmailContainer>
  );
};

// exemple pour react-email-preview (en dev)
NotifyInstructionCloseEmail.PreviewProps = {
  demarcheTitre: 'PCAET 2024-2030',
  motif: DemarchePcaetTransitionEnum.DELAI_AVIS_ECHU,
  documentsUrl: 'https://app.territoiresentransitions.fr',
  sendToEmail: 'pilote@collectivite.fr',
};

export default NotifyInstructionCloseEmail;
