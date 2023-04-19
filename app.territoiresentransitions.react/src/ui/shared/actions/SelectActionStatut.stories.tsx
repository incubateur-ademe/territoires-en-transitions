import React from 'react';
import {Story, Meta} from '@storybook/react';
import {
  SelectActionStatut,
  TSelectActionStatutProps,
  ITEMS_AVEC_NON_CONCERNE,
} from './SelectActionStatut';

export default {
  component: SelectActionStatut,
} as Meta;

const Template: Story<TSelectActionStatutProps> = args => (
  <div style={{width: 200}}>
    <SelectActionStatut {...args} />
  </div>
);

export const SelectionParDefaut = Template.bind({});
export const AvecSelection = Template.bind({});
AvecSelection.args = {
  value: 'fait',
};

export const AvecNonConcerne = Template.bind({});
AvecNonConcerne.args = {
  value: 'non_concerne',
  items: ITEMS_AVEC_NON_CONCERNE,
};
