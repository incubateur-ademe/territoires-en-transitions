import React from 'react';
import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {FiltreAuditStatut} from './FiltreAuditStatut';
import {TFiltreProps} from './filters';

export default {
  component: FiltreAuditStatut,
} as Meta;

const Template: Story<TFiltreProps> = args => <FiltreAuditStatut {...args} />;

export const Tous = Template.bind({});
Tous.args = {
  filters: {statut: ['tous']},
  setFilters: action('setFilters'),
};

export const Selection = Template.bind({});
Selection.args = {
  filters: {statut: ['non_audite', 'en_cours']},
  setFilters: action('setFilters'),
};
