import {Story, Meta} from '@storybook/react';
// import { action } from '@storybook/addon-actions';
import {
  NiveauLabellisation,
  TNiveauLabellisationProps,
} from './NiveauLabellisation';

export default {
  component: NiveauLabellisation,
} as Meta;

const Template: Story<TNiveauLabellisationProps> = args => (
  <NiveauLabellisation {...args} />
);

export const NonLabellise = Template.bind({});
NonLabellise.args = {
  labellisation: {
    collectivite_id: 1,
    etoiles: 0,
    score_realise: 0.1,
    score_programme: 0.62,
  },
};

export const UneEtoile = Template.bind({});
UneEtoile.args = {
  labellisation: {
    collectivite_id: 1,
    etoiles: 1,
    obtenue_le: new Date('2022-03-14T09:43:00.251Z'),
    score_realise: 0.2,
    score_programme: 0.62,
  },
};

export const DeuxEtoilesPossible = Template.bind({});
DeuxEtoilesPossible.args = {
  labellisation: {
    collectivite_id: 1,
    etoiles: 1,
    obtenue_le: new Date('2022-03-14T09:43:00.251Z'),
    score_realise: 0.36,
    score_programme: 0.62,
  },
};

export const DeuxEtoiles = Template.bind({});
DeuxEtoiles.args = {
  labellisation: {
    collectivite_id: 1,
    etoiles: 2,
    obtenue_le: new Date('2022-03-14T09:43:00.251Z'),
    score_realise: 0.37,
    score_programme: 0.62,
  },
};

export const TroisEtoiles = Template.bind({});
TroisEtoiles.args = {
  labellisation: {
    collectivite_id: 1,
    etoiles: 3,
    obtenue_le: new Date('2022-03-14T09:43:00.251Z'),
    score_realise: 0.51,
    score_programme: 0.62,
  },
};

export const QuatreEtoiles = Template.bind({});
QuatreEtoiles.args = {
  labellisation: {
    collectivite_id: 1,
    etoiles: 4,
    obtenue_le: new Date('2022-03-14T09:43:00.251Z'),
    score_realise: 0.65,
    score_programme: 0.8,
  },
};

export const CinqEtoiles = Template.bind({});
CinqEtoiles.args = {
  labellisation: {
    collectivite_id: 1,
    etoiles: 5,
    obtenue_le: new Date('2022-03-14T09:43:00.251Z'),
    score_realise: 0.75,
    score_programme: 0.8,
  },
};
