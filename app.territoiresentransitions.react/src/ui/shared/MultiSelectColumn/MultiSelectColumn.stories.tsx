import {Meta} from '@storybook/react';
import {MultiSelectColumn} from './index';

export default {
  component: MultiSelectColumn,
} as Meta;

export const AucuneColonneMasquee = {
  args: {
    label: 'Libellé',
    values: ['opt1', 'opt3', 'opt2'],
    items: [
      {separator: 'Séparateur 1'},
      {value: 'opt1', label: 'Option 1'},
      {value: 'opt2', label: 'Option 2'},
      {separator: 'Séparateur 2'},
      {value: 'opt3', label: 'Option 3'},
    ],
  },
};

export const UneColonneMasquee = {
  args: {
    label: 'Libellé',
    values: ['opt1', 'opt3'],
    items: [
      {separator: 'Séparateur 1'},
      {value: 'opt1', label: 'Option 1'},
      {value: 'opt2', label: 'Option 2'},
      {separator: 'Séparateur 2'},
      {value: 'opt3', label: 'Option 3'},
    ],
  },
};

export const DeuxColonnesMasquees = {
  args: {
    label: 'Libellé',
    values: ['opt2'],
    items: [
      {separator: 'Séparateur 1'},
      {value: 'opt1', label: 'Option 1'},
      {value: 'opt2', label: 'Option 2'},
      {separator: 'Séparateur 2'},
      {value: 'opt3', label: 'Option 3'},
    ],
  },
};

export const ToutesLesColonnesMasquées = {
  args: {
    label: 'Libellé',
    values: [],
    items: [
      {separator: 'Séparateur 1'},
      {value: 'opt1', label: 'Option 1'},
      {value: 'opt2', label: 'Option 2'},
      {separator: 'Séparateur 2'},
      {value: 'opt3', label: 'Option 3'},
    ],
  },
};
