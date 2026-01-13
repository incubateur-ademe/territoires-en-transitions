import { Meta} from '@storybook/nextjs-vite';
import {FiltreStatut} from './FiltreStatut';

export default {
  component: FiltreStatut,
} as Meta;

export const All = {
  args: {
    filters: {statut: ['tous']},
  },
};

export const MultiSelect = {
  args: {
    filters: {statut: ['programme', 'fait']},
  },
};
