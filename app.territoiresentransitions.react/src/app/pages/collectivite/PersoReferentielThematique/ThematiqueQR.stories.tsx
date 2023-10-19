import {StoryFn, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {ThematiqueQR, TThematiqueQRProps} from './ThematiqueQR';
import Fixture from '../PersoPotentielModal/fixture.json';

export default {
  component: ThematiqueQR,
} as Meta;

const Template: StoryFn<TThematiqueQRProps> = args => (
  <ThematiqueQR
    onChange={action('onChange')}
    collectivite={{
      id: 1,
      nom: 'Grand Montauban',
    }}
    questionReponses={[Fixture.Q1, Fixture.Q2, {...Fixture.Q3, reponse: 60}]}
    {...args}
  />
);

export const PlusieursQuestions = {
  render: Template,

  args: {
    thematique: {
      nom: 'Urbanisme et habitat',
    },
  },
};

export const LienThematiqueSuivante = {
  render: Template,

  args: {
    thematique: {
      nom: 'Urbanisme et habitat',
    },
    nextThematiqueId: 'dechets',
  },
};

export const ThematiqueIdentite = {
  render: Template,

  args: {
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
  },
};
