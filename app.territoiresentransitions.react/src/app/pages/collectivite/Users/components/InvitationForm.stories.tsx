import React from 'react';
import InvitationForm from './InvitationForm';

export default {
  component: InvitationForm,
};

const fakeCurrentAdmin = {
  email: 'yolo@dodo.com',
  acces: 'admin',
};

const fakeCurrentEditeur = {
  email: 'yala@dada.com',
  acces: 'edition',
};

export const AsAdmin = () => <InvitationForm currentUser={fakeCurrentAdmin} />;

export const AsEditeur = () => (
  <InvitationForm currentUser={fakeCurrentEditeur} />
);
