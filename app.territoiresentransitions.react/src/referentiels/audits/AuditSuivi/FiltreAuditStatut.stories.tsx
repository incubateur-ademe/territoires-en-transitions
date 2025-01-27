import { Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {FiltreAuditStatut} from './FiltreAuditStatut';

export default {
  component: FiltreAuditStatut,
} as Meta;

export const Tous = {
  args: {
    filters: {statut: ['tous']},
    setFilters: action('setFilters'),
  },
};

export const Selection = {
  args: {
    filters: {statut: ['non_audite', 'en_cours']},
    setFilters: action('setFilters'),
  },
};
