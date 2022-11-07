import {Story, Meta} from '@storybook/react';
import {MultiSelectFilter, TMultiSelectFilterProps, ITEM_ALL} from './index';

export default {
  component: MultiSelectFilter,
} as Meta;

const Template: Story<TMultiSelectFilterProps> = args => (
  <MultiSelectFilter {...args} />
);

const items = [
  {value: ITEM_ALL, label: 'Toutes'},
  {value: 'opt1', label: 'Option 1'},
  {value: 'opt2', label: 'Option 2'},
  {value: 'opt3', label: 'Option 3'},
];

export const Toutes = Template.bind({});
Toutes.args = {
  label: 'Libellé',
  values: [ITEM_ALL],
  items,
};

export const Selection = Template.bind({});
Selection.args = {
  label: 'Libellé',
  values: ['opt1', 'opt3'],
  items,
};
