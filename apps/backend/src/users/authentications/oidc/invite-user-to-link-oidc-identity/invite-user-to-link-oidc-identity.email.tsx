import { Section, Text } from '@react-email/components';
import { CTAButton } from '@tet/backend/utils/notifications/components/cta.button';
import { EmailContainer } from '@tet/backend/utils/notifications/components/email-container';
import { Footer } from '@tet/backend/utils/notifications/components/footer';
import * as React from 'react';

/** Données attendues par le template `InviteUserToLinkOidcIdentityEmail`. */
export interface DemanderRattachementProps {
  /** Email de l'ancien compte (destinataire réel du mail — jamais l'email ProConnect) */
  sendToEmail: string;
  /** Prénom + nom affirmés par ProConnect (claims `given_name`/`usual_name`) */
  demandeurNom: string;
  /** Email ProConnect du demandeur (affiché pour que le titulaire du compte identifie qui demande) */
  demandeurEmail: string;
  /** Lien de confirmation à usage unique (`${APP_URL}/auth/proconnect/confirmer-rattachement?token=...`) */
  confirmationUrl: string;
}

/**
 * Email de confirmation du fallback « mot de passe oublié » (cas 3-Oui) :
 * envoyé à l'ANCIENNE adresse (celle du compte historique), jamais à l'email
 * ProConnect. Nomme explicitement l'identité ProConnect demandeuse pour que
 * le titulaire du compte puisse juger si la demande est légitime.
 */
export const InviteUserToLinkOidcIdentityEmail = (
  props: DemanderRattachementProps
): React.ReactNode => {
  const { sendToEmail, demandeurNom, demandeurEmail, confirmationUrl } = props;

  return (
    <EmailContainer>
      <Text>Bonjour,</Text>

      <Text>
        <b>{demandeurNom}</b> ({demandeurEmail}) s&apos;est connecté(e) via
        ProConnect et a indiqué posséder un compte Territoires en Transitions
        avec cette adresse email.
      </Text>

      <Text>
        Si c&apos;est bien vous, cliquez sur le lien ci-dessous pour associer
        votre compte ProConnect à ce compte existant. Ce lien est valable 24 h
        et à usage unique.
      </Text>

      <Section className="my-8 text-center">
        <CTAButton href={confirmationUrl}>
          Associer mon compte ProConnect →
        </CTAButton>
      </Section>

      <Text>
        Si vous n&apos;êtes pas à l&apos;origine de cette demande, ignorez cet
        email : aucune action n&apos;est nécessaire et votre compte reste
        inchangé.
      </Text>

      <Footer toEmail={sendToEmail} />
    </EmailContainer>
  );
};

// exemple pour react-email-preview (en dev)
InviteUserToLinkOidcIdentityEmail.PreviewProps = {
  sendToEmail: 'ancien-compte@example.com',
  demandeurNom: 'Jeanne Dupont',
  demandeurEmail: 'jeanne.dupont@proconnect.example.com',
  confirmationUrl:
    'https://app.territoiresentransitions.fr/auth/proconnect/confirmer-rattachement?token=exemple',
};

export default InviteUserToLinkOidcIdentityEmail;
