import { Heading, Link, Text } from '@react-email/components';
import { EmailContainer } from '@tet/backend/utils/notifications/components/email-container';
import { Footer } from '@tet/backend/utils/notifications/components/footer';
import * as React from 'react';
import { NotifyPiloteMultiFichesProps } from './notify-pilote-multi-fiches.props';

/** Génère le contenu de la notification envoyée quand un pilote est attribué à plusieurs fiches */
export const NotifyPiloteMultiFichesEmail = (
  props: NotifyPiloteMultiFichesProps
): React.ReactNode => {
  const { assignedTo, sendToEmail, assignedActions, unsubscribeUrl } = props;

  return (
    <EmailContainer>
      <Text>Bonjour {assignedTo},</Text>

      <Text>
        Vous avez été assigné(e) à plusieurs actions sur Territoires en
        Transitions.
      </Text>

      <Heading as="h3">Détails des actions</Heading>
      <ul>
        {assignedActions.map(
          ({
            actionTitre,
            actionUrl,
            planNom,
            isSousAction,
            sousActionTitre,
          }) => (
            <li>
              {isSousAction ? (
                <>
                  <b>{sousActionTitre || 'Sans titre'}</b>
                  {actionTitre && <i> ({actionTitre})</i>}
                </>
              ) : (
                <b>{actionTitre || 'Sans titre'}</b>
              )}
              {planNom ? ` - ${planNom}` : ''}
              <br />
              <Link href={actionUrl}>
                Voir {isSousAction ? 'la sous-action' : "l'action"} →
              </Link>
            </li>
          )
        )}
      </ul>

      <Footer toEmail={sendToEmail} unsubscribeUrl={unsubscribeUrl} />
    </EmailContainer>
  );
};

// exemple pour react-email-preview (en dev)
NotifyPiloteMultiFichesEmail.PreviewProps = {
  assignedTo: "<prénom de l'assigné>",
  sendToEmail: "<email de l'assigné>",
  assignedActions: [
    // plan et action sans titre
    {
      planNom: null,
      actionTitre: null,
      actionUrl: '#',
    },
    // plan, action et sous-action sans titre
    {
      planNom: null,
      actionTitre: null,
      sousActionTitre: null,
      isSousAction: true,
      actionUrl: '#',
    },
    {
      planNom: '<nom du plan>',
      actionTitre: null,
      actionUrl: '#',
    },
    {
      planNom: '<nom du plan>',
      actionTitre: "<titre de l'action>",
      actionUrl: '#',
    },
    {
      planNom: '<nom du plan>',
      actionTitre: "<titre de l'action>",
      sousActionTitre: null,
      isSousAction: true,
      actionUrl: '#',
    },
    {
      planNom: '<nom du plan>',
      actionTitre: "<titre de l'action>",
      sousActionTitre: '<titre de la sous action>',
      isSousAction: true,
      actionUrl: '#',
    },
  ],
  unsubscribeUrl: '#',
};

export default NotifyPiloteMultiFichesEmail;
