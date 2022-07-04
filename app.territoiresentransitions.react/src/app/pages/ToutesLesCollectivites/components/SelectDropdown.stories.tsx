import {Story, Meta} from '@storybook/react';
import {SelectDropdown, TSelectDropdownProps} from './SelectDropdown';

export default {
  component: SelectDropdown,
} as Meta;

const Template: Story<TSelectDropdownProps<string>> = args => (
  <ul>
    <SelectDropdown {...args} />
  </ul>
);

const options = [
  {id: 'score', libelle: '% Réalisé courant'},
  {id: 'completude', libelle: 'Taux de remplissage'},
  {id: 'nom', libelle: 'Ordre alphabétique'},
];

export const SelectionAucunParDefaut = Template.bind({});
const selectionAucunParDefautArgs: TSelectDropdownProps<string> = {
  title: 'Trier par',
  options: options,
  onChange: (selected: string) => {
    console.log(selected);
  },
};
SelectionAucunParDefaut.args = selectionAucunParDefautArgs;
