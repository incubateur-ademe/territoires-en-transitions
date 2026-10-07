import { Heading, Link, Text } from '@react-email/components';
import { EmailContainer } from '@tet/backend/utils/notifications/components/email-container';
import { Footer } from '@tet/backend/utils/notifications/components/footer';
import * as React from 'react';
import { SendContactMessageInput } from './send-contact-message.input';

export type SendContactMessageEmailProps = Pick<
  SendContactMessageInput,
  'objet' | 'prenom' | 'nom' | 'email' | 'tel' | 'message'
> & {
  /** Adresse de la boîte qui reçoit le message, pour le pied de page. */
  sendToEmail: string;
  /** Libellé lisible de l'objet, tel que proposé dans le formulaire. */
  objetLabel: string;
};

/**
 * Message reçu via le formulaire de contact du site public.
 *
 * L'ancienne edge function concaténait le HTML à la main et échappait les
 * champs avec une regex maison ; React échappe nativement le contenu
 * interpolé, il n'y a donc plus rien à faire de particulier ici.
 */
export const SendContactMessageEmail = (
  props: SendContactMessageEmailProps
): React.ReactNode => {
  const { prenom, nom, email, tel, message, objetLabel, sendToEmail } = props;

  return (
    <EmailContainer>
      <Heading as="h3">{objetLabel}</Heading>

      <Text>
        De : {prenom} {nom} (<Link href={`mailto:${email}`}>{email}</Link>
        {tel ? `, tél. : ${tel}` : ''})
      </Text>

      {/* `whiteSpace: pre-line` conserve les retours à la ligne saisis dans le
          textarea, que le HTML écraserait sinon. */}
      <Text style={{ whiteSpace: 'pre-line' }}>{message}</Text>

      <Footer
        toEmail={sendToEmail}
        raison="Vous l'avez reçu car ce message a été envoyé depuis le formulaire de contact du site public."
      />
    </EmailContainer>
  );
};
