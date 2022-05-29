import {Story, Meta} from '@storybook/react';
import {CollectiviteCarte, TCollectiviteCarteProps} from './CollectiviteCarte';

export default {
  component: CollectiviteCarte,
} as Meta;

const Template: Story<TCollectiviteCarteProps> = args => (
  <CollectiviteCarte {...args} />
);

export const Exemple1 = Template.bind({});
Exemple1.args = {
  collectivite: {
    collectivite_id: 1,
    nom: 'Ambérieu-en-Bugey',
    type_collectivite: 'commune',
    code_siren_insee: '01004',
    region_code: '84',
    departement_code: '01',
    population: 14514,
    etoiles_cae: 2,
    etoiles_eci: 1,
    score_fait_cae: 0,
    score_fait_eci: 0,
    score_programme_cae: 0,
    score_programme_eci: 0,
    completude_cae: 0,
    completude_eci: 0,
  },
};
