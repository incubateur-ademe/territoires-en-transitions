import { Meta, StoryFn } from '@storybook/nextjs';
import { CritereScore, TCritereScoreProps } from './CritereScore';
import fixture from './fixture.json';
import { TLabellisationParcours } from './types';

export default {
  component: CritereScore,
} as Meta;

const Template: StoryFn<TCritereScoreProps> = (args) => (
  <ul>
    <CritereScore
      {...args}
      parcours={fixture.parcours1 as TLabellisationParcours}
    />
  </ul>
);

export const Niveau1NonAtteint = {
  render: Template,

  args: {
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
  },
};

export const Niveau1Atteint = {
  render: Template,

  args: {
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
  },
};

export const NiveauSuivantNonAtteint = {
  render: Template,

  args: {
    collectiviteId: 1,
    parcours: fixture.parcours1,
  },
};

export const NiveauSuivantAtteint = {
  render: Template,

  args: {
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
  },
};
