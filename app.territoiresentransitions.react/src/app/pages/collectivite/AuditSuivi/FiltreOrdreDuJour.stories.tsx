import React from 'react';
import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {FiltreOrdreDuJour} from './FiltreOrdreDuJour';
import {TFiltreProps} from './filters';

export default {
  component: FiltreOrdreDuJour,
} as Meta;

const Template: Story<TFiltreProps> = args => <FiltreOrdreDuJour {...args} />;

export const Tous = Template.bind({});
Tous.args = {
  filters: {ordre_du_jour: ['tous']},
  setFilters: action('setFilters'),
};

export const Selection = Template.bind({});
Selection.args = {
  filters: {ordre_du_jour: ['true']},
  setFilters: action('setFilters'),
};
