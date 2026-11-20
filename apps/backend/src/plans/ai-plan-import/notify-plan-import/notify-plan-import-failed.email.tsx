import { Section, Text } from '@react-email/components';
import { CTAButton } from '@tet/backend/utils/notifications/components/cta.button';
import { EmailContainer } from '@tet/backend/utils/notifications/components/email-container';
import { Footer } from '@tet/backend/utils/notifications/components/footer';
import * as React from 'react';

export const NotifyPlanImportFailedEmail = ({
  planName,
  importUrl,
  sendToEmail,
}: {
  planName: string;
  importUrl: string;
  sendToEmail: string;
}): React.ReactNode => (
  <EmailContainer>
    <Text>Bonjour,</Text>
    <Text>
      L&apos;import de votre plan <b>{planName}</b> n&apos;a pas abouti.
    </Text>
    <Text>
      Consultez le compte rendu pour connaître la cause et la marche à suivre :
      corriger votre document, réessayer ou contacter notre équipe.
    </Text>
    <Section className="my-8 text-center">
      <CTAButton href={importUrl}>Consulter le compte rendu</CTAButton>
    </Section>
    <Footer
      toEmail={sendToEmail}
      raison="Vous recevez ce message car vous avez lancé cet import sur Territoiresentransitions.fr"
    />
  </EmailContainer>
);
