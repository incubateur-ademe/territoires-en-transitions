import {Story, Meta} from '@storybook/react';
import {
  MultiSelectCheckboxes,
  TMultiSelectCheckboxesProps,
} from './MultiSelectCheckboxes';

export default {
  component: MultiSelectCheckboxes,
} as Meta;

const Template: Story<TMultiSelectCheckboxesProps<string>> = args => (
  <ul>
    <MultiSelectCheckboxes {...args} />
  </ul>
);

const options = [
  {id: 'NL', libelle: 'Non labellisé'},
  {id: '1', libelle: 'Première étoile'},
  {id: '2', libelle: 'Deuxième étoile'},
  {id: '3', libelle: 'Troisième étoile'},
  {id: '4', libelle: 'Quatrième étoile'},
  {id: '5', libelle: 'Cinquième étoile'},
];

export const SelectionTousParDefaut = Template.bind({});
const selectionTousParDefautArgs: TMultiSelectCheckboxesProps<string> = {
  title: 'Niveau de labellisation',
  options: options,
  selected: [],
  onChange: (selected: string[]) => {
    console.log(selected);
  },
};
SelectionTousParDefaut.args = selectionTousParDefautArgs;

export const SelectionMultiple = Template.bind({});
const selectionMultipleArgs: TMultiSelectCheckboxesProps<string> = {
  title: 'Niveau de labellisation',
  options: options,
  selected: ['NL', '1'],
  onChange: (selected: string[]) => {
    console.log(selected);
  },
};
SelectionMultiple.args = selectionMultipleArgs;
