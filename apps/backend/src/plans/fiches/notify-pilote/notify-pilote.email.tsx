import { Heading, Section, Text } from '@react-email/components';
import { CTAButton } from '@tet/backend/utils/notifications/components/cta.button';
import { EmailContainer } from '@tet/backend/utils/notifications/components/email-container';
import { Footer } from '@tet/backend/utils/notifications/components/footer';
import { formatDate } from '@tet/backend/utils/notifications/components/format-date.utils';
import * as React from 'react';
import { NotifyPiloteProps } from './notify-pilote.props';

/** Génère le contenu de la notification envoyée quand un pilote est attribué à une fiche */
export const NotifyPiloteEmail = (
  props: NotifyPiloteProps
): React.ReactNode => {
  const {
    assignedTo,
    assignedBy,
    assignedAction,
    sendToEmail,
    unsubscribeUrl,
  } = props;

  const {
    sousActionTitre,
    actionTitre,
    actionDateFin,
    planNom,
    actionUrl,
    isSousAction,
  } = assignedAction;

  const actionType = isSousAction ? 'la sous-action' : "l'action";
  const dateFin = formatDate(actionDateFin);

  return (
    <EmailContainer>
      <Text>Bonjour {assignedTo},</Text>

      <Text>
        {assignedBy} vous a assigné(e) une nouvelle{' '}
        {isSousAction ? 'sous-action' : 'action'} à réaliser.
      </Text>

      <Heading as="h3">Détails de {actionType}</Heading>
      <ul>
        {isSousAction ? (
          <>
            <li>
              <b>Sous-action</b> : {sousActionTitre || 'Sans titre'}
            </li>
            {actionTitre && (
              <li>
                <b>Action parente</b> : {actionTitre}
              </li>
            )}
          </>
        ) : (
          <li>
            <b>Action</b> : {actionTitre || 'Sans titre'}
          </li>
        )}
        {planNom && (
          <li>
            <b>Plan</b> : {planNom}
          </li>
        )}
        {dateFin && (
          <li>
            <b>Date de fin</b> : {dateFin}
          </li>
        )}
      </ul>

      <Section className="my-8 text-center">
        <CTAButton href={actionUrl}>Voir {actionType} →</CTAButton>
      </Section>

      <Footer toEmail={sendToEmail} unsubscribeUrl={unsubscribeUrl} />
    </EmailContainer>
  );
};

// exemple pour react-email-preview (en dev)
NotifyPiloteEmail.PreviewProps = {
  assignedTo: "<prénom de l'assigné>",
  assignedBy: "<prénom de l'assigneur>",
  assignedAction: {
    planNom: '<nom du plan>',
    actionTitre: "<nom de l'action>",
    actionDateFin: '2025-11-20T17:02:19.958Z',
    actionUrl: 'https://app.territoiresentransitions.fr',
    sousActionTitre: '<nom de la sous-action>',
    isSousAction: true,
  },
  sendToEmail: "<email de l'assigné>",
  unsubscribeUrl: 'https://app.territoiresentransitions.fr',
};

export default NotifyPiloteEmail;
