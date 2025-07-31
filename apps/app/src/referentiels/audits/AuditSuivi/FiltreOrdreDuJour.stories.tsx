import { Meta} from '@storybook/nextjs';
import {action} from 'storybook/actions';
import {FiltreOrdreDuJour} from './FiltreOrdreDuJour';

export default {
  component: FiltreOrdreDuJour,
} as Meta;

export const Tous = {
  args: {
    filters: {ordre_du_jour: ['tous']},
    setFilters: action('setFilters'),
  },
};

export const Selection = {
  args: {
    filters: {ordre_du_jour: ['true']},
    setFilters: action('setFilters'),
  },
};
