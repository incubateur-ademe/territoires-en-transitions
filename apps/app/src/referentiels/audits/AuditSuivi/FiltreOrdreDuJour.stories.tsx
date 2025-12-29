import { Meta } from '@storybook/nextjs-vite';
import { action } from 'storybook/actions';
import { FiltreOrdreDuJour } from './FiltreOrdreDuJour';

export default {
  component: FiltreOrdreDuJour,
} as Meta;

export const Tous = {
  args: {
    filters: { ordreDuJour: ['tous'] },
    setFilters: action('setFilters'),
  },
};

export const Selection = {
  args: {
    filters: { ordreDuJour: ['true'] },
    setFilters: action('setFilters'),
  },
};
