import { Text } from '@react-email/components';
import { EmailContainer } from '@tet/backend/utils/notifications/components/email-container';
import { Footer } from '@tet/backend/utils/notifications/components/footer';
import * as React from 'react';
import { NotifyReportFailedProps } from './notify-report-failed.props';

/** Génère le contenu de la notification envoyée quand un rapport de plan est généré avec succès */
export const NotifyReportFailedEmail = (
  props: NotifyReportFailedProps
): React.ReactNode => {
  const { reportName } = props;

  return (
    <EmailContainer>
      <Text>Bonjour,</Text>

      <Text>
        Nous rencontrons une erreur et le rapport de plan <b>{reportName}</b>{' '}
        n&apos;a pas pu être généré. Nos équipes ont été informées et
        reviendrons vers vous rapidement.
      </Text>

      <Text>L&apos;équipe Territoires en Transitions</Text>

      <Footer />
    </EmailContainer>
  );
};

// exemple pour react-email-preview (en dev)
NotifyReportFailedEmail.PreviewProps = {
  reportName: 'Rapport_CA de Blois Agglopolys_PCAET 2019-2025.pptx',
};

export default NotifyReportFailedEmail;
