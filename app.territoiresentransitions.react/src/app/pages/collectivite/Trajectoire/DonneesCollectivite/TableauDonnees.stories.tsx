import React from 'react';
import {Meta} from '@storybook/nextjs';
import {TableauDonnees} from './TableauDonnees';
import {DonneesGES} from './fixture';

export default {
  component: TableauDonnees,
} as Meta;

const Template = args => <TableauDonnees {...args} />;

export const Exemple1 = Template.bind({});
Exemple1.args = {
  ...DonneesGES,
};
