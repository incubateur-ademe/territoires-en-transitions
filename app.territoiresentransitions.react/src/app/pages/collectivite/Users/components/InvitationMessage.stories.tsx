import React from 'react';
import InvitationMessage from './InvitationMessage';
import {fakeCurrentCollectiviteAdmin} from '../../../../../fixtures/currentCollectivite';
import {fakeUserData} from '../../../../../fixtures/userData';

export default {
  component: InvitationMessage,
};
export const AccesEdition = () => (
  <InvitationMessage
    currentCollectivite={fakeCurrentCollectiviteAdmin}
    currentUser={fakeUserData}
    acces="edition"
    invitationUrl="https://invitationUrl"
  />
);
