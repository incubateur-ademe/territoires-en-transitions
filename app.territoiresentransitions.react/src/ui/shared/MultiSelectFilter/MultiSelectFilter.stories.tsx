import {Story, Meta} from '@storybook/react';
// import { action } from '@storybook/addon-actions';
import {MultiSelectFilter, TMultiSelectFilterProps} from './index';

export default {
  component: MultiSelectFilter,
} as Meta;

const Template: Story<TMultiSelectFilterProps> = args => (
  <MultiSelectFilter {...args} />
);

export const Exemple1 = Template.bind({});
Exemple1.args = {
  label: 'Libellé',
  values: ['opt1', 'opt3'],
  items: [
    {value: 'opt1', label: 'Option 1'},
    {value: 'opt2', label: 'Option 2'},
    {value: 'opt3', label: 'Option 3'},
  ],
};
Exemple1.parameters = {storyshots: false};
