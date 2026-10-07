import { Section, Text } from '@react-email/components';
import { CTAButton } from '@tet/backend/utils/notifications/components/cta.button';
import { EmailContainer } from '@tet/backend/utils/notifications/components/email-container';
import { Footer } from '@tet/backend/utils/notifications/components/footer';
import * as React from 'react';

export type InvitationCorrespondantEmailProps = {
  sendToEmail: string;
  serviceNom: string;
  /** Le service rend un avis (DREAL, conseil régional) ou consulte seulement. */
  deposeUnAvis: boolean;
  /** Le rôle posé vient du fichier : ne pas promettre plus qu'il n'accorde. */
  estAdministrateur: boolean;
  /** Le compte reste à créer, ou il existe déjà et le droit vient d'être posé. */
  urlType: 'invitation' | 'rattachement';
  actionUrl: string;
};

/**
 * Premier contact avec le correspondant d'un service de l'État : personne ne
 * l'a invité nommément, il faut donc dire pourquoi il reçoit ce message, au
 * titre de quel service, et ce qu'on attend de lui.
 */
export const InvitationCorrespondantEmail = ({
  sendToEmail,
  serviceNom,
  deposeUnAvis,
  estAdministrateur,
  urlType,
  actionUrl,
}: InvitationCorrespondantEmailProps): React.ReactNode => {
  // Les dénominations officielles dépassent la centaine de caractères : le nom
  // n'est donné qu'une fois, la suite dit « votre service ».
  const role = deposeUnAvis
    ? 'Votre service y rend son avis et y suit ses échéances.'
    : 'Votre service y consulte les démarches déposées sur son territoire, ainsi que les avis rendus.';

  const suite = estAdministrateur
    ? `${
        urlType === 'invitation' ? 'Créez votre compte' : 'Connectez-vous'
      }, puis invitez vos collègues depuis la gestion des utilisateurs de votre service.`
    : `${urlType === 'invitation' ? 'Créez votre compte' : 'Connectez-vous'} pour y accéder.`;

  return (
    <EmailContainer>
      <Text>Bonjour,</Text>

      <Text>
        Votre adresse nous a été transmise comme correspondant PCAET de{' '}
        <strong>{serviceNom}</strong>.
      </Text>

      <Text>
        Les collectivités déposent désormais leur PCAET pour avis sur
        Territoires en Transitions. {role}
      </Text>

      <Text>
        {estAdministrateur ? (
          <>
            Un accès <strong>administrateur</strong> à l&apos;espace de votre
            service vous est ouvert.
          </>
        ) : (
          <>Un accès à l&apos;espace de votre service vous est ouvert.</>
        )}{' '}
        {suite}
      </Text>

      <Section className="my-8 text-center">
        <CTAButton href={actionUrl}>
          {urlType === 'invitation'
            ? 'Je crée mon compte'
            : "J'accède à l'espace de mon service"}
        </CTAButton>
      </Section>

      <Text>
        Si vous n&apos;êtes pas la bonne personne, écrivez-nous à
        contact@territoiresentransitions.fr.
      </Text>

      <Footer
        toEmail={sendToEmail}
        raison={`Vous l'avez reçu car votre adresse nous a été transmise comme correspondant PCAET de ${serviceNom}.`}
      />
    </EmailContainer>
  );
};

InvitationCorrespondantEmail.PreviewProps = {
  sendToEmail: 'correspondant@developpement-durable.gouv.fr',
  serviceNom: 'DREAL Bretagne',
  deposeUnAvis: true,
  estAdministrateur: true,
  urlType: 'invitation' as const,
  actionUrl:
    'https://app.territoiresentransitions.fr/invitation/550e8400-e29b-41d4-a716-446655440000',
};

export default InvitationCorrespondantEmail;
