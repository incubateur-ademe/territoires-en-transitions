import React from 'react';
import {Story} from '@storybook/react';
import {action} from '@storybook/addon-actions';

import {Membres, MembresProps} from './Membres';

import {fakeUserData} from '../../../../fixtures/userData';
import {
  fakeCurrentCollectiviteAdmin,
  fakeCurrentCollectiviteLecture,
} from '../../../../fixtures/currentCollectivite';
import {fakeMembres} from './components/fakeData';
import {TUpdateMembre} from './types';

export default {
  component: Membres,
};

const Template: Story<MembresProps> = args => <Membres {...args} />;

const handlers = {
  updateMembre: action('updateMembre') as TUpdateMembre,
  removeFromCollectivite: action('removeFromCollectivite'),
};

export const AsAdmin = Template.bind({});
const AsAdminArgs: MembresProps = {
  currentUser: fakeUserData,
  membres: fakeMembres,
  isLoading: false,
  collectivite: fakeCurrentCollectiviteAdmin,
  ...handlers,
};
AsAdmin.args = AsAdminArgs;

export const AsLecteur = Template.bind({});
const AsLecteurArgs: MembresProps = {
  currentUser: {...fakeUserData, id: '3'},
  membres: fakeMembres,
  isLoading: false,
  collectivite: fakeCurrentCollectiviteLecture,
  ...handlers,
};
AsLecteur.args = AsLecteurArgs;
