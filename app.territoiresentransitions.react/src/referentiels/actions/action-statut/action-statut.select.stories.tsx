import React from 'react';
import { StoryFn, Meta } from '@storybook/nextjs';
import {
  SelectActionStatut,
  TSelectActionStatutProps,
  ITEMS_AVEC_NON_CONCERNE,
} from './action-statut.select';

export default {
  component: SelectActionStatut,
} as Meta;

const Template: StoryFn<TSelectActionStatutProps> = (args) => (
  <div style={{ width: 200 }}>
    <SelectActionStatut {...args} />
  </div>
);

export const SelectionParDefaut = {
  render: Template,
};

export const AvecSelection = {
  render: Template,

  args: {
    value: 'fait',
  },
};

export const AvecNonConcerne = {
  render: Template,

  args: {
    value: 'non_concerne',
    items: ITEMS_AVEC_NON_CONCERNE,
  },
};
