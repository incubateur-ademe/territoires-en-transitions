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

export const NonLabellise0 = Template.bind({});
NonLabellise0.args = {
  labellisation: {
    collectivite_id: 1,
    etoiles: 0,
    score_realise: 0.1,
    score_programme: 0.62,
  },
};

export const NonLabellise1 = Template.bind({});
NonLabellise1.args = {
  labellisation: {
    collectivite_id: 1,
    etoiles: 0,
    score_realise: 0.56,
    score_programme: 0.62,
  },
};
