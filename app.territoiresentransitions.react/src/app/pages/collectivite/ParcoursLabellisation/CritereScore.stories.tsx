import {Story, Meta} from '@storybook/react';
import {CritereScore, TCritereScoreProps} from './CritereScore';
import fixture from './fixture.json';

export default {
  component: CritereScore,
} as Meta;

const Template: Story<TCritereScoreProps> = args => (
  <ul>
    <CritereScore parcours={fixture.parcours1} {...args} />
  </ul>
);

export const Niveau1NonAtteint = Template.bind({});
Niveau1NonAtteint.args = {
  collectiviteId: 1,
  parcours: {
    ...fixture.parcours1,
    critere_score: {
      atteint: false,
      etoiles: '1',
      score_fait: 0,
      score_a_realiser: 0,
    },
  },
};

export const Niveau1Atteint = Template.bind({});
Niveau1Atteint.args = {
  collectiviteId: 1,
  parcours: {
    ...fixture.parcours1,
    critere_score: {
      atteint: true,
      etoiles: '1',
      score_fait: 0,
      score_a_realiser: 0,
    },
  },
};

export const NiveauSuivantNonAtteint = Template.bind({});
NiveauSuivantNonAtteint.args = {
  collectiviteId: 1,
  parcours: fixture.parcours1,
};

export const NiveauSuivantAtteint = Template.bind({});
NiveauSuivantAtteint.args = {
  collectiviteId: 1,
  parcours: {
    ...fixture.parcours1,
    critere_score: {
      atteint: true,
      etoiles: '2',
      score_fait: 0.42,
      score_a_realiser: 0.35,
    },
  },
};
