import React from 'react';
import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';

import HistoriqueFiltres, {HistoriqueFiltresProps} from './HistoriqueFiltres';
import {TSetFilters} from '../filters';

export default {
  component: HistoriqueFiltres,
} as Meta;

const Template: Story<HistoriqueFiltresProps> = args => (
  <HistoriqueFiltres {...args} />
);

const handlers = {
  setFilters: action('setFilters') as TSetFilters,
};

export const Defaut = Template.bind({});
const filtresArgs = {
  itemsNumber: 0,
  initialFilters: {collectivite_id: 1},
  filters: {
    collectivite_id: 1,
  },
  ...handlers,
};
Defaut.args = filtresArgs;

export const AvecFiltres = Template.bind({});
const avecFiltresArgs = {
  itemsNumber: 4,
  initialFilters: {collectivite_id: 1},
  filters: {
    collectivite_id: 1,
    types: ['action_statut'],
    startDate: '2022-11-03',
    endDate: '2022-11-24',
  },
  ...handlers,
};
AvecFiltres.args = avecFiltresArgs;
