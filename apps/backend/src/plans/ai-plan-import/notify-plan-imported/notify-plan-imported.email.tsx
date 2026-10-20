import { Link, Section, Text } from '@react-email/components';
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
  const { planName, planRecap, planUrl, sendToEmail } = props;

  return (
    <EmailContainer>
      <Text>Bonjour,</Text>

      <Text>
        Votre plan <b>{planName}</b> a bien été importé sur la plateforme
        {planRecap ? (
          <>
            {' '}
            : {planRecap} et principales informations ont été créés sur la base
            du fichier source
          </>
        ) : null}
        .
      </Text>

      <Text>
        Cet import permet de gagner du temps sur la mise en ligne, mais il
        restera à compléter directement sur la plateforme toutes les
        informations utiles au suivi de vos actions.
      </Text>

      <Text>
        Notre outil d&apos;import est en version bêta : si vous observez des
        incohérences quant à la structure du plan ou au contenu des fiches
        action, n&apos;hésitez pas à nous le signaler via le support en ligne ou
        par mail à{' '}
        <Link href="mailto:contact@territoiresentransitions.fr">
          contact@territoiresentransitions.fr
        </Link>{' '}
        pour qu&apos;on vous aide à le reprendre.
      </Text>

      <Section className="my-8 text-center">
        <CTAButton href={planUrl}>Voir le plan →</CTAButton>
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
  planRecap: '5 axes, 11 sous-axes, 224 actions',
  planUrl: 'https://app.territoiresentransitions.fr',
  sendToEmail: 'editeur@collectivite.fr',
};

export default NotifyPlanImportedEmail;
