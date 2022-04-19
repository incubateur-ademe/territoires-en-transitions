import {Story, Meta} from '@storybook/react';
// import { action } from '@storybook/addon-actions';
import {CarteIdentite, TCarteIdentiteProps} from './CarteIdentite';

export default {
  component: CarteIdentite,
} as Meta;

const Template: Story<TCarteIdentiteProps> = args => (
  <CarteIdentite {...args} />
);

export const Exemple1 = Template.bind({});
Exemple1.args = {
  identite: {
    code_siren_insee: '01004',
    collectivite_id: 1,
    departement_name: 'Ain',
    nom: 'Ambérieu-en-Bugey',
    population_source: 'Insee 12/01/2022',
    population_totale: 14514,
    region_name: 'Auvergne-Rhône-Alpes',
    type_collectivite: 'commune',
  },
};
