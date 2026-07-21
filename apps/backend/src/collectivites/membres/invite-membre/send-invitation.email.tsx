import { Link, Section, Text } from '@react-email/components';
import { CTAButton } from '@tet/backend/utils/notifications/components/cta.button';
import { EmailContainer } from '@tet/backend/utils/notifications/components/email-container';
import { Footer } from '@tet/backend/utils/notifications/components/footer';
import * as React from 'react';

export type SendInvitationEmailProps = {
  sendToEmail: string;
  senderPrenom: string;
  senderNom: string;
  senderEmail: string;
  collectiviteNom: string;
  invitationUrl: string;
  urlType: 'invitation' | 'rattachement';
};

/** Mail d'invitation à rejoindre une collectivité (ou notification de rattachement). */
export const SendInvitationEmail = (
  props: SendInvitationEmailProps
): React.ReactNode => {
  const {
    sendToEmail,
    senderPrenom,
    senderNom,
    senderEmail,
    collectiviteNom,
    invitationUrl,
    urlType,
  } = props;

  const ctaLabel =
    urlType === 'invitation'
      ? 'Je rejoins la collectivité'
      : 'Je lance Territoires en transitions !';

  return (
    <EmailContainer>
      <Text>Bonjour,</Text>

      <Text>
        {senderPrenom} {senderNom} ({senderEmail}) vous invite à contribuer pour{' '}
        {collectiviteNom} sur Territoires en Transitions.
      </Text>

      <Section className="my-8 text-center">
        <CTAButton href={invitationUrl}>{ctaLabel}</CTAButton>
      </Section>

      {urlType === 'invitation' ? (
        <Text className="italic">
          Envie d&apos;en savoir plus sur la plateforme ? RDV sur :{' '}
          <Link href="https://www.territoiresentransitions.fr/outil-numerique">
            https://www.territoiresentransitions.fr/outil-numerique
          </Link>
        </Text>
      ) : null}

      <Text>À bientôt sur la plateforme !</Text>

      <Footer toEmail={sendToEmail} />
    </EmailContainer>
  );
};

SendInvitationEmail.PreviewProps = {
  sendToEmail: 'destinataire@example.com',
  senderPrenom: 'Jean',
  senderNom: 'Dupont',
  senderEmail: 'jean.dupont@example.com',
  collectiviteNom: 'Commune de Lyon',
  invitationUrl:
    'https://app.territoiresentransitions.fr/invitation/550e8400-e29b-41d4-a716-446655440000',
  urlType: 'invitation' as const,
};

export default SendInvitationEmail;
