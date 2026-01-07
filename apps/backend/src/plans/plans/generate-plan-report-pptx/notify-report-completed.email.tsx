import { Section, Text } from '@react-email/components';
import { CTAButton } from '@tet/backend/utils/notifications/components/cta.button';
import { EmailContainer } from '@tet/backend/utils/notifications/components/email-container';
import { Footer } from '@tet/backend/utils/notifications/components/footer';
import * as React from 'react';
import { NotifyReportCompletedProps } from './notify-report-completed.props';

/** Génère le contenu de la notification envoyée quand un rapport de plan est généré avec succès */
export const NotifyReportCompletedEmail = (
  props: NotifyReportCompletedProps
): React.ReactNode => {
  const { reportName, reportUrl } = props;

  return (
    <EmailContainer>
      <Text>Bonjour,</Text>

      <Text>
        Le rapport de plan <b>{reportName}</b> a été généré avec succès et est
        prêt à être téléchargé.
      </Text>

      <Section className="my-8 text-center">
        <CTAButton href={reportUrl}>Télécharger le rapport →</CTAButton>
      </Section>

      <Footer />
    </EmailContainer>
  );
};

// exemple pour react-email-preview (en dev)
NotifyReportCompletedEmail.PreviewProps = {
  reportName: 'Rapport_CA de Blois Agglopolys_PCAET 2019-2025.pptx',
  reportUrl: 'https://app.territoiresentransitions.fr',
};

export default NotifyReportCompletedEmail;
