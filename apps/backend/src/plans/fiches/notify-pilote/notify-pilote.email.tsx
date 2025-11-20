import { Heading, Section, Text } from '@react-email/components';
import * as React from 'react';
import { NotifyPiloteProps } from './notify-pilote.props';
import { CTAButton } from '@/backend/utils/notifications/components/cta.button';
import { EmailContainer } from '@/backend/utils/notifications/components/email-container';
import { Footer } from '@/backend/utils/notifications/components/footer';

const DESCRIPTION_MAX_LENGTH = 200;

/** Génère le contenu de la notification envoyée quand un pilote est attribué à une fiche */
export const NotifyPiloteEmail = (
  props: NotifyPiloteProps
): React.ReactNode => {
  const {
    assignedTo,
    assignedBy,
    sousActionTitre,
    actionTitre,
    planNom,
    dateFin,
    description,
    actionUrl,
    isSousAction,
  } = props;

  const actionType = isSousAction ? 'la sous-action' : "l'action";

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
            <li>Sous-action : {sousActionTitre || 'Sans titre'}</li>
            {actionTitre && <li>Action parente : {actionTitre}</li>}
          </>
        ) : (
          <li>Action : {actionTitre}</li>
        )}
        {planNom && <li>Plan d'action : {planNom}</li>}
        {dateFin && <li>Date de fin : {dateFin}</li>}
      </ul>

      {description && (
        <Text>
          {description.length > DESCRIPTION_MAX_LENGTH
            ? `${description.substring(0, DESCRIPTION_MAX_LENGTH)}...`
            : description}
        </Text>
      )}

      <Section className="my-8 text-center">
        <CTAButton href={actionUrl}>Voir {actionType} →</CTAButton>
      </Section>

      <Footer />
    </EmailContainer>
  );
};

// exemple pour react-email-preview (en dev)
NotifyPiloteEmail.PreviewProps = {
  assignedTo: "<prénom de l'assigné>",
  assignedBy: "<prénom de l'assigneur>",
  actionTitre: "<nom de l'action>",
  sousActionTitre: '<nom de la sous-action>',
  planNom: '<nom du plan>',
  dateFin: "<date d'échéance si définie>",
  description: '<courte description si disponible>',
  actionUrl: 'https://app.territoiresentransitions.fr',
  isSousAction: true,
};

export default NotifyPiloteEmail;
