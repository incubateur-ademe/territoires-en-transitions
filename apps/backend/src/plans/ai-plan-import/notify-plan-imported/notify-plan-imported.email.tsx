import { Section, Text } from '@react-email/components';
import { CTAButton } from '@tet/backend/utils/notifications/components/cta.button';
import { EmailContainer } from '@tet/backend/utils/notifications/components/email-container';
import { Footer } from '@tet/backend/utils/notifications/components/footer';
import * as React from 'react';
import { NotifyPlanImportedProps } from './notify-plan-imported.props';

/**
 * Le plan créé par l'import IA, annoncé à qui a lancé l'import : il est
 * disponible, mais attend sa vérification avant de compter.
 */
export const NotifyPlanImportedEmail = (
  props: NotifyPlanImportedProps
): React.ReactNode => {
  const { planName, planUrl, sendToEmail } = props;

  return (
    <EmailContainer>
      <Text>Bonjour,</Text>

      <Text>
        Votre plan <b>{planName}</b> a été créé à partir du fichier que vous
        avez importé. Il est disponible sur la plateforme.
      </Text>

      <Text>
        L&apos;import est en version bêta : certains éléments ont pu être
        manqués ou mal repérés. Relisez le plan, comparez-le à votre document et
        corrigez-le si besoin, puis validez-le depuis sa page. Tant qu&apos;il
        n&apos;est pas validé, il ne compte pas dans le programme d&apos;actions
        d&apos;une démarche PCAET.
      </Text>

      <Section className="my-8 text-center">
        <CTAButton href={planUrl}>Vérifier le plan →</CTAButton>
      </Section>

      <Footer
        toEmail={sendToEmail}
        raison="Vous recevez ce message car vous avez importé ce plan sur Territoiresentransitions.fr"
      />
    </EmailContainer>
  );
};

// exemple pour react-email-preview (en dev)
NotifyPlanImportedEmail.PreviewProps = {
  planName: 'PCAET 2024-2030',
  planUrl: 'https://app.territoiresentransitions.fr',
  sendToEmail: 'editeur@collectivite.fr',
};

export default NotifyPlanImportedEmail;
