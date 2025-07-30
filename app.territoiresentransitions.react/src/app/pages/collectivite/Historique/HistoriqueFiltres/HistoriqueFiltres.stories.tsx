import {Meta} from '@storybook/nextjs';
import {action} from 'storybook/actions';

import HistoriqueFiltres from './HistoriqueFiltres';
import {TSetFilters} from '../filters';

export default {
  component: HistoriqueFiltres,
} as Meta;

const handlers = {
  setFilters: action('setFilters') as TSetFilters,
};

const filtresArgs = {
  itemsNumber: 0,
  initialFilters: {collectivite_id: 1},
  filters: {
    collectivite_id: 1,
  },
  ...handlers,
};

export const Defaut = {
  args: filtresArgs,
};

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

export const AvecFiltres = {
  args: avecFiltresArgs,
};
