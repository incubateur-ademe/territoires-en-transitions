import {Story, Meta} from '@storybook/react';
import {
  MultiSelectDropdown,
  TMultiSelectDropdownProps,
} from './MultiSelectDropdown';

export default {
  component: MultiSelectDropdown,
} as Meta;

const Template: Story<TMultiSelectDropdownProps<string>> = args => (
  <ul>
    <MultiSelectDropdown {...args} />
  </ul>
);

const options = [
  {id: '69', libelle: 'Auvergne-Rhône-Alpes'},
  {id: '29', libelle: 'Bretagne'},
  {id: '94', libelle: 'Corse'},
  {id: '11', libelle: 'Île de France'},
  {id: '28', libelle: 'Normandie'},
];

export const SelectionAucunParDefaut = Template.bind({});
const selectionAucunParDefautArgs: TMultiSelectDropdownProps<string> = {
  title: 'Région',
  options: options,
  selected: [],
  onChange: (selected: string[]) => {
    console.log(selected);
  },
};
SelectionAucunParDefaut.args = selectionAucunParDefautArgs;

export const SelectionMultiple = Template.bind({});
const selectionMultipleArgs: TMultiSelectDropdownProps<string> = {
  title: 'Région',
  options: options,
  selected: ['94', '11'],
  onChange: (selected: string[]) => {
    console.log(selected);
  },
};
SelectionMultiple.args = selectionMultipleArgs;
