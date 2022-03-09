import {Story, Meta} from '@storybook/react';
// import { action } from '@storybook/addon-actions';
import {
  FeaturesUseBarChart,
  TFeaturesUseBarChartProps,
} from './FeaturesUseBarChart';

export default {
  component: FeaturesUseBarChart,
} as Meta;

const Template: Story<TFeaturesUseBarChartProps> = args => (
  <FeaturesUseBarChart {...args} />
);

export const Exemple1 = Template.bind({});
Exemple1.args = {
  widthPx: 500,
  proportions: {
    fiche_action_avg: 0.06319702602230483,
    cae_statuses_avg: 0.04460966542750929,
    eci_statuses_avg: 0.4944237918215613,
    indicateur_referentiel_avg: 0.13382899628252787,
    indicateur_personnalise_avg: 0.0037174721189591076,
  },
};
