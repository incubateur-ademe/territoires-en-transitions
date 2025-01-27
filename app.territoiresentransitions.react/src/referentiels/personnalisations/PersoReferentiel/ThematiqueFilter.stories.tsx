import { Meta} from '@storybook/react';
import {ThematiqueFilter} from './ThematiqueFilter';

export default {
  component: ThematiqueFilter,
} as Meta;

export const SelectionVide = {
  args: {
    referentiels: [],
  },
};

export const CAESeulement = {
  args: {
    referentiels: ['cae'],
  },
};

export const ECISeulement = {
  args: {
    referentiels: ['eci'],
  },
};

export const CAEEtECI = {
  args: {
    referentiels: ['cae', 'eci'],
  },
};
