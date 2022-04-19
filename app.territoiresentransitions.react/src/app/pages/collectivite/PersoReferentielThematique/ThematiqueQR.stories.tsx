import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {ThematiqueQR, TThematiqueQRProps} from './ThematiqueQR';
import {Q1, Q2, Q3} from '../PersoPotentielModal/fixture.json';

export default {
  component: ThematiqueQR,
} as Meta;

const Template: Story<TThematiqueQRProps> = args => (
  <ThematiqueQR
    onChange={action('onChange')}
    collectivite={{
      id: 1,
      nom: 'Grand Montauban',
    }}
    questionReponses={[Q1, Q2, {...Q3, reponse: 60}]}
    {...args}
  />
);

export const PlusieursQuestions = Template.bind({});
PlusieursQuestions.args = {
  thematique: {
    nom: 'Urbanisme et habitat',
  },
};

export const LienThematiqueSuivante = Template.bind({});
LienThematiqueSuivante.args = {
  thematique: {
    nom: 'Urbanisme et habitat',
  },
  nextThematiqueId: 'dechets',
};

export const ThematiqueIdentite = Template.bind({});
ThematiqueIdentite.args = {
  thematique: {
    nom: "Carte d'identité",
  },
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
