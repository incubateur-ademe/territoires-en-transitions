import {
  ReferentielAxisScoresPolarArea,
  ReferentielAxisScoresPolarAreaProps,
} from './ReferentielAxisScoresPolarArea';
import {Story, Meta} from '@storybook/react';

const Template: Story<ReferentielAxisScoresPolarAreaProps> = args => (
  <ReferentielAxisScoresPolarArea {...args} />
);
export const CAEExample = Template.bind({});

const props: ReferentielAxisScoresPolarAreaProps = {
  data: [
    {
      label: [['1. Planification'], ['territoriale']],
      percentages: {
        fait: 0,
        programme: 0,
        pas_fait: 0,
        non_renseigne: 100,
      },
      potentielPoints: 100,
    },
    {
      label: [['2. Patrimoine de la'], ['collectivité']],
      percentages: {
        fait: 0,
        programme: 0,
        pas_fait: 10,
        non_renseigne: 90,
      },
      potentielPoints: 64,
    },
    {
      label: [['3. Approvisionnement énergie'], ['eau, assainissement']],
      percentages: {
        fait: 10,
        programme: 20,
        pas_fait: 70,
        non_renseigne: 0,
      },
      potentielPoints: 94,
    },
    {
      label: [['4. Mobilité']],
      percentages: {
        fait: 10,
        programme: 40,
        pas_fait: 50,
        non_renseigne: 0,
      },
      potentielPoints: 96,
    },
    {
      label: [['5. Organisation'], ['interne']],
      percentages: {
        fait: 40,
        programme: 30,
        pas_fait: 30,
        non_renseigne: 0,
      },
      potentielPoints: 46,
    },

    {
      label: [['6. Coopération, '], ['communication']],
      percentages: {
        fait: 80,
        programme: 20,
        pas_fait: 0,
        non_renseigne: 0,
      },
      potentielPoints: 100,
    },
  ],
};

CAEExample.args = props;

export default {
  title: 'Charts/ReferentielAxisScoresPolarArea',
  component: CAEExample,
} as Meta;
